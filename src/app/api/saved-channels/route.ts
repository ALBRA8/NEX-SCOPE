import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/saved-channels — list current user's saved channels
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const channels = await db.savedChannel.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ channels });
  } catch (error: any) {
    console.error('[saved-channels GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/saved-channels — save a channel
// Body: { channelId, channelName, subscribers }
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, channelName, subscribers } = body;

    if (!channelId || !channelName) {
      return NextResponse.json(
        { error: 'channelId y channelName son requeridos' },
        { status: 400 }
      );
    }

    const existing = await db.savedChannel.findFirst({
      where: { userId: user.id, channelId },
    });

    if (existing) {
      return NextResponse.json({ channel: existing, alreadySaved: true });
    }

    const channel = await db.savedChannel.create({
      data: {
        channelId,
        channelName,
        subscribers: typeof subscribers === 'number' ? subscribers : 0,
        userId: user.id,
      },
    });

    return NextResponse.json({ channel, saved: true });
  } catch (error: any) {
    console.error('[saved-channels POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/saved-channels?channelId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json({ error: 'channelId es requerido' }, { status: 400 });
    }

    await db.savedChannel.deleteMany({
      where: { userId: user.id, channelId },
    });

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    console.error('[saved-channels DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
