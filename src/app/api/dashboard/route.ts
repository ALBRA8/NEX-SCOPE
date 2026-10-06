import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const [savedNiches, savedChannels, savedPlans, chatMessages] = await Promise.all([
      db.savedNiche.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      db.savedChannel.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      db.contentPlan.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      db.chatMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    return NextResponse.json({
      stats: {
        savedNiches: savedNiches.length,
        savedChannels: savedChannels.length,
        savedPlans: savedPlans.length,
        chatMessages: chatMessages.length,
      },
      recentNiches: savedNiches.slice(0, 5).map(n => ({
        id: n.id,
        nicheId: n.nicheId,
        name: n.nicheName,
        category: n.category || 'Sin categoría',
        nicheScore: n.nicheScore || 0,
        createdAt: n.createdAt,
      })),
      recentChannels: savedChannels.slice(0, 5).map(c => ({
        id: c.id,
        channelId: c.channelId,
        name: c.channelName,
        subscribers: c.subscribers || 0,
        createdAt: c.createdAt,
      })),
      recentPlans: savedPlans.slice(0, 5).map(p => ({
        id: p.id,
        niche: p.niche,
        audience: p.audience,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    logError('Dashboard API', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al cargar datos del dashboard') },
      { status: 500 }
    );
  }
}
