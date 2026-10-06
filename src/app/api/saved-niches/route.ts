import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

// GET /api/saved-niches — list current user's saved niches
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const niches = await db.savedNiche.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ niches });
  } catch (error: any) {
    logError('saved-niches GET', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al cargar nichos') },
      { status: 500 }
    );
  }
}

// POST /api/saved-niches — save a niche for the current user
// Body: { nicheId, nicheName, category, nicheScore }
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido' },
        { status: 400 }
      );
    }
    const { nicheId, nicheName, category, nicheScore } = body;

    if (
      !nicheId || typeof nicheId !== 'string' ||
      !nicheName || typeof nicheName !== 'string'
    ) {
      return NextResponse.json(
        { error: 'nicheId y nicheName son requeridos' },
        { status: 400 }
      );
    }

    // Cap input lengths to prevent DB bloat.
    const safeNicheId = nicheId.slice(0, 200);
    const safeNicheName = nicheName.slice(0, 300);
    const safeCategory = (category ? String(category) : 'General').slice(0, 100);
    const safeNicheScore = typeof nicheScore === 'number' ? nicheScore : 0;

    const existing = await db.savedNiche.findFirst({
      where: { userId: user.id, nicheId: safeNicheId },
    });

    if (existing) {
      return NextResponse.json({ niche: existing, alreadySaved: true });
    }

    const niche = await db.savedNiche.create({
      data: {
        nicheId: safeNicheId,
        nicheName: safeNicheName,
        category: safeCategory,
        nicheScore: safeNicheScore,
        userId: user.id,
      },
    });

    return NextResponse.json({ niche, saved: true });
  } catch (error: any) {
    logError('saved-niches POST', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al guardar nicho') },
      { status: 500 }
    );
  }
}

// DELETE /api/saved-niches?nicheId=xxx — remove a saved niche
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nicheId = searchParams.get('nicheId');

    if (!nicheId) {
      return NextResponse.json({ error: 'nicheId es requerido' }, { status: 400 });
    }

    await db.savedNiche.deleteMany({
      where: { userId: user.id, nicheId },
    });

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    logError('saved-niches DELETE', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al borrar nicho') },
      { status: 500 }
    );
  }
}
