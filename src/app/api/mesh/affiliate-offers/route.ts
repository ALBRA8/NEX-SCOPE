import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mesh/affiliate-offers
 *
 * Returns ExternalSignal rows of type `affiliate_offer` that CAZADOR
 * pushed via the mesh webhook. Consume-on-read: rows are marked
 * consumed after being returned, so subsequent calls only return new
 * offers.
 *
 * This is SEPARATE from /api/affiliate-offers (which returns the
 * static curated TOP_AFFILIATE_OFFERS list). The two endpoints
 * serve different purposes:
 *   - /api/affiliate-offers → curated static list
 *   - /api/mesh/affiliate-offers → user's CAZADOR-captured offers
 *
 * Auth: requires authenticated user. Returns 401 otherwise.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  try {
    const signals = await db.externalSignal.findMany({
      where: {
        userId: user.id,
        type: 'affiliate_offer',
        consumed: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (signals.length > 0) {
      await db.externalSignal.updateMany({
        where: {
          id: { in: signals.map((s) => s.id) },
        },
        data: { consumed: true },
      });
    }

    const offers = signals.map((s) => {
      let data: Record<string, unknown> = {};
      let metadata: Record<string, unknown> = {};
      try { data = JSON.parse(s.data); } catch {}
      if (s.metadata) {
        try { metadata = JSON.parse(s.metadata); } catch {}
      }
      return {
        id: s.id,
        capturedAt: s.createdAt,
        data,
        metadata,
      };
    });

    return NextResponse.json({
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error('[mesh/affiliate-offers] Error:', error);
    return NextResponse.json(
      { error: 'Error al leer ofertas capturadas' },
      { status: 500 }
    );
  }
}
