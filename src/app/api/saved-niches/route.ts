import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

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
    console.error('[saved-niches GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const body = await request.json();
    const { nicheId, nicheName, category, nicheScore } = body;

    if (!nicheId || !nicheName) {
      return NextResponse.json(
        { error: 'nicheId y nicheName son requeridos' },
        { status: 400 }
      );
    }

    // Upsert: avoid duplicates per user (unique on userId+nicheId)
    const existing = await db.savedNiche.findFirst({
      where: { userId: user.id, nicheId },
    });

    if (existing) {
      return NextResponse.json({ niche: existing, alreadySaved: true });
    }

    const niche = await db.savedNiche.create({
      data: {
        nicheId,
        nicheName,
        category: category || 'General',
        nicheScore: typeof nicheScore === 'number' ? nicheScore : 0,
        userId: user.id,
      },
    });

    return NextResponse.json({ niche, saved: true });
  } catch (error: any) {
    console.error('[saved-niches POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    console.error('[saved-niches DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
