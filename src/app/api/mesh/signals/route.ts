import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RESULTS_PER_CALL = 200;

/**
 * GET /api/mesh/signals?type=affiliate_offer&consumed=false&source=cazador&limit=50
 *
 * Lists ExternalSignal rows for the authenticated user with optional
 * filters. Unlike `GET /api/affiliate-offers`, this endpoint does NOT
 * mark rows consumed — it's a read-only listing endpoint for the
 * settings / debug UI.
 *
 * Query params (all optional):
 *   - type      — filter by signal type (e.g. `affiliate_offer`)
 *   - source    — filter by source (e.g. `cazador`)
 *   - consumed  — `true` / `false` to filter; omit to return both
 *   - limit     — int 1..200, default 50
 *
 * Response shape:
 *   {
 *     count: number,
 *     signals: Array<{
 *       id: string,
 *       source: string,
 *       type: string,
 *       data: Record<string, unknown>,
 *       metadata: Record<string, unknown> | null,
 *       consumed: boolean,
 *       createdAt: string
 *     }>
 *   }
 *
 * - 401 when not authenticated.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const source = searchParams.get('source');
    const consumedRaw = searchParams.get('consumed');
    const limitRaw = Number.parseInt(searchParams.get('limit') ?? '50', 10);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, MAX_RESULTS_PER_CALL)
        : 50;

    // Build the Prisma `where` clause incrementally so each filter is
    // applied only when the user supplied it. `consumed` is special
    // because it's a boolean — we accept `true`/`false` strings and
    // ignore anything else (treats "I didn't pass it" the same as "I
    // passed garbage").
    const where: { userId: string; type?: string; source?: string; consumed?: boolean } = {
      userId: user.id,
    };
    if (type) where.type = type;
    if (source) where.source = source;
    if (consumedRaw === 'true') where.consumed = true;
    else if (consumedRaw === 'false') where.consumed = false;

    const signals = await db.externalSignal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        source: true,
        type: true,
        data: true,
        metadata: true,
        consumed: true,
        createdAt: true,
      },
    });

    const out = signals.map((s) => {
      let parsedData: Record<string, unknown> = {};
      try {
        parsedData = s.data ? (JSON.parse(s.data) as Record<string, unknown>) : {};
      } catch {
        parsedData = { _raw: s.data };
      }
      let parsedMetadata: Record<string, unknown> | null = null;
      if (s.metadata) {
        try {
          parsedMetadata = JSON.parse(s.metadata) as Record<string, unknown>;
        } catch {
          parsedMetadata = { _raw: s.metadata };
        }
      }
      return {
        id: s.id,
        source: s.source,
        type: s.type,
        data: parsedData,
        metadata: parsedMetadata,
        consumed: s.consumed,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ count: out.length, signals: out });
  } catch (error) {
    logError('mesh signals GET', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al listar signals') },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/mesh/signals?id=<cuid>
 *
 * Deletes a single ExternalSignal row owned by the authenticated user.
 * The `userId` filter in the where clause guarantees a user can't
 * delete another user's signals even if they guess the cuid.
 *
 * Response shape:
 *   { success: true, deleted: true }   — row was found and deleted
 *   { success: true, deleted: false }  — row didn't exist (or wasn't
 *                                        owned by this user)
 * - 400 when `id` query param is missing.
 * - 401 when not authenticated.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || id.length === 0) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 },
      );
    }

    // deleteMany (vs delete) so we don't 404 when the row is missing
    // or belongs to a different user — both look the same to the caller
    // (deleted:false) and we don't leak the existence of other users'
    // signals via a PicoRecon-style timing oracle.
    const result = await db.externalSignal.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count > 0,
    });
  } catch (error) {
    logError('mesh signals DELETE', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al borrar signal') },
      { status: 500 },
    );
  }
}
