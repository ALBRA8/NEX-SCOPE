import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { verifyCazadorSignatureFromRequest } from '@/lib/mesh';
import { safeErrorMessage, logError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Allowed signal types — the union of CAZADOR's emission surfaces
// (affiliate scraper + 4 YouTube context menus) plus the open-ended
// values CHISMOSO/NEX-SCOPE may push later. Unknown types are rejected
// with 400 so a misconfigured sender can't pollute the table.
// ---------------------------------------------------------------------------
const ALLOWED_SOURCES = new Set(['cazador', 'chismoso', 'nexscope', 'radar-secop2', 'manual']);
const ALLOWED_TYPES = new Set([
  'affiliate_offer',
  'channel_analysis',
  'niche_save',
  'ad_spy',
  'product_spy',
  'ping',
]);

interface ExternalSignalPayload {
  source: string;
  type: string;
  data: Record<string, unknown>;
  metadata?: {
    url?: string;
    scrapedAt?: string;
    extractorUsed?: string;
    [k: string]: unknown;
  };
}

/**
 * POST /api/mesh/external-signals
 *
 * Inbound mesh endpoint for external agents (CAZADOR, CHISMOSO, etc.)
 * pushing structured signals into NEX-SCOPE. The request MUST be:
 *   1. Authenticated — the sender's browser carries the user's
 *      httpOnly JWT cookie (same-browser SSO pattern).
 *   2. HMAC-signed — `X-Cazador-Signature: sha256=<hex>` matches
 *      `HMAC-SHA256(rawBody, CAZADOR_WEBHOOK_SECRET)`. When the env
 *      var is unset the route runs in open mode (dev only) and logs
 *      a warning per request.
 *
 * Body shape:
 *   {
 *     source: 'cazador',
 *     type: 'affiliate_offer' | 'channel_analysis' | 'niche_save' |
 *           'ad_spy' | 'product_spy' | 'ping',
 *     data: Record<string, unknown>,
 *     metadata?: { url?: string; scrapedAt?: string; extractorUsed?: string }
 *   }
 *
 * Response: `{ success: true, signalId: <cuid> }`
 *  - 401 when not authenticated.
 *  - 401 when the signature is missing/malformed/mismatched (only when
 *     `CAZADOR_WEBHOOK_SECRET` is set).
 *  - 400 when the body is invalid JSON or fails shape validation.
 *  - 500 on persistence failure.
 */
export async function POST(request: NextRequest) {
  try {
    // --- 1. Authenticate ------------------------------------------------
    // The sender (CAZADOR extension) runs in the same browser the user
    // is logged into NEX-SCOPE with, so the httpOnly JWT cookie is
    // attached automatically. We resolve the user here so the signal
    // is attributed to them and isolated from other users' inboxes.
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    // --- 2. Read raw body ONCE — signature is over the exact bytes ----
    // The HMAC signature is computed over the raw request body. We
    // must read it BEFORE parsing to JSON. Once parsed + re-serialized,
    // key order / whitespace may differ and the signature wouldn't
    // verify.
    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Cuerpo de la petición inválido' },
        { status: 400 },
      );
    }

    // --- 3. HMAC verification ------------------------------------------
    // When CAZADOR_WEBHOOK_SECRET is unset, the verifier returns
    // `{ verified: true, reason: 'no_secret_configured_open_inbound' }`
    // and logs a warning. In production the operator MUST set the
    // secret — otherwise any authed user can push arbitrary signals
    // under any source name.
    const sigResult = verifyCazadorSignatureFromRequest(request, rawBody);
    if (!sigResult.verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          details: { reason: sigResult.reason ?? 'signature_verification_failed' },
        },
        { status: 401 },
      );
    }

    // --- 4. Parse + validate shape -------------------------------------
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'JSON inválido' },
        { status: 400 },
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Body debe ser un objeto' },
        { status: 400 },
      );
    }

    const payload = body as Partial<ExternalSignalPayload>;
    if (typeof payload.source !== 'string' || payload.source.length === 0) {
      return NextResponse.json(
        { success: false, error: 'source es requerido' },
        { status: 400 },
      );
    }
    if (typeof payload.type !== 'string' || payload.type.length === 0) {
      return NextResponse.json(
        { success: false, error: 'type es requerido' },
        { status: 400 },
      );
    }
    if (!ALLOWED_SOURCES.has(payload.source)) {
      return NextResponse.json(
        { success: false, error: `source desconocido: ${payload.source}` },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.has(payload.type)) {
      return NextResponse.json(
        { success: false, error: `type desconocido: ${payload.type}` },
        { status: 400 },
      );
    }
    if (!payload.data || typeof payload.data !== 'object') {
      return NextResponse.json(
        { success: false, error: 'data debe ser un objeto' },
        { status: 400 },
      );
    }

    // --- 5. Persist ----------------------------------------------------
    // `data` and `metadata` are stored as JSON strings (SQLite has no
    // native JSON column type with Prisma's sqlite provider). Consumers
    // JSON.parse them on read — see /api/affiliate-offers.
    const signal = await db.externalSignal.create({
      data: {
        userId: user.id,
        source: payload.source,
        type: payload.type,
        data: JSON.stringify(payload.data),
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        consumed: false,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, signalId: signal.id });
  } catch (error) {
    logError('mesh external-signals POST', error);
    return NextResponse.json(
      { success: false, error: safeErrorMessage(error, 'Error al ingestar señal') },
      { status: 500 },
    );
  }
}
