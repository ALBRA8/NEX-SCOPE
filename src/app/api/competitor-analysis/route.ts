import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  // ━━ Auth gate ━━
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Cuerpo de la petición inválido' }, { status: 400 });
    }
    const { channels } = body;
    if (!Array.isArray(channels) || channels.length < 2) {
      return NextResponse.json({ error: 'Se requieren al menos 2 canales para comparar' }, { status: 400 });
    }
    // Cap the number and shape of channels to prevent giant prompts / prompt
    // injection via huge strings. Each channel string is capped to 200 chars.
    const MAX_CHANNELS = 10;
    const safeChannels = channels
      .slice(0, MAX_CHANNELS)
      .filter((ch: any) => ch && typeof ch === 'object')
      .map((ch: any) => ({
        name: String(ch.name || '').slice(0, 200),
        subscribers: Number(ch.subscribers) || 0,
        totalViews: Number(ch.totalViews) || 0,
        videoCount: Number(ch.videoCount) || 0,
        engagementRate: Number(ch.engagementRate) || 0,
      }));

    if (safeChannels.length < 2) {
      return NextResponse.json({ error: 'Se requieren al menos 2 canales para comparar' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const channelList = safeChannels.map((ch: any, i: number) =>
      `Canal ${i + 1}: ${ch.name} — ${ch.subscribers} subs, ${ch.totalViews} vistas, ${ch.videoCount} videos, ${ch.engagementRate}% engagement`
    ).join('\n');

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un analista experto en canales de YouTube. Cuando se te da una lista de canales, devuelves UNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "analysis": [
    {
      "channelIndex": indice_base_0,
      "strengths": ["fortaleza1", "fortaleza2", "fortaleza3"],
      "weaknesses": ["debilidad1", "debilidad2"],
      "opportunities": ["oportunidad1", "oportunidad2"],
      "overallScore": numero_del_1_al_100,
      "recommendation": "recomendación breve"
    }
  ],
  "winner": {
    "channelIndex": indice,
    "reason": "razón breve"
  }
}`
        },
        {
          role: 'user',
          content: `Analiza y compara estos canales:\n${channelList}`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    const parsed = extractJson(content);
    if (parsed && Array.isArray(parsed.analysis)) {
      return NextResponse.json({ ...parsed, source: 'ai' });
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    logError('Competitor analysis API', error);
    const isNetworkError =
      error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.cause?.code === 'ECONNREFUSED' ||
      error?.name === 'TypeError' ||
      /fetch failed|connect timeout|network/i.test(error?.message || '');
    if (isNetworkError) {
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible.', code: 'AI_UNAVAILABLE' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Error al analizar competidores.' }, { status: 500 });
  }
}
