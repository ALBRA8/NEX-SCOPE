import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { channels } = await req.json();
    if (!Array.isArray(channels) || channels.length < 2) {
      return NextResponse.json({ error: 'Se requieren al menos 2 canales para comparar' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const channelList = channels.map((ch: any, i: number) =>
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

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.analysis)) {
        return NextResponse.json({ ...parsed, source: 'ai' });
      }
      return NextResponse.json({ error: 'Formato inesperado de la IA.' }, { status: 502 });
    } catch {
      return NextResponse.json({ error: 'La IA no devolvió JSON válido.' }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Competitor analysis API error:', error);
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
    return NextResponse.json({ error: 'Error al analizar competidores.', details: error?.message }, { status: 500 });
  }
}
