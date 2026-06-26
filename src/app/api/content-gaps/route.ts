import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { niche } = await req.json();
    const safeNiche = (niche || '').toString().trim() || 'Inteligencia Artificial & ML';

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un analista experto en contenido de YouTube. Cuando se te da un nicho, analizas las brechas de contenido existentes y devuelves UNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "gaps": [
    {
      "topic": "nombre del tema/brecha",
      "searchVolume": numero,
      "existingVideos": numero,
      "opportunityScore": numero_del_1_al_100,
      "suggestedTitle": "título sugerido para el video"
    }
  ]
}
Devuelve exactamente 8 brechas de contenido. Los datos deben ser realistas para el nicho dado.`
        },
        {
          role: 'user',
          content: `Analiza las brechas de contenido para el nicho: ${safeNiche}`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.gaps) && parsed.gaps.length > 0) {
        return NextResponse.json({ gaps: parsed.gaps, source: 'ai' });
      }
      return NextResponse.json(
        { error: 'La IA respondió en formato inesperado. Intenta de nuevo.', raw: content.substring(0, 200) },
        { status: 502 }
      );
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'La IA no devolvió JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Content gaps API error:', error);

    const isNetworkError =
      error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.cause?.code === 'ECONNREFUSED' ||
      error?.cause?.code === 'ENOTFOUND' ||
      error?.name === 'TypeError' ||
      /fetch failed|connect timeout|network/i.test(error?.message || '');

    if (isNetworkError) {
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible en este entorno.', code: 'AI_UNAVAILABLE' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error al analizar brechas. Intenta de nuevo.', details: error?.message },
      { status: 500 }
    );
  }
}
