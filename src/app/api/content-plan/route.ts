import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { niche, audience } = await req.json();
    const safeNiche = (niche || '').toString().trim() || 'Inteligencia Artificial & ML';
    const safeAudience = (audience || '').toString().trim() || 'Jóvenes de 18-35 años';

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un planificador de contenido experto en YouTube. Cuando se te da un nicho y audiencia, generas un plan de contenido de 30 videos y devuelves UNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "plan": [
    {
      "title": "título del video",
      "description": "breve descripción",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "estimatedViews": numero_estimado,
      "difficulty": "fácil|medio|difícil",
      "format": "Tutorial|Review|Análisis|Lista|Vlog|Q&A|Live|Entrevista|Serie|Noticias|Opinión",
      "week": numero_de_semana_1_a_10
    }
  ]
}
Genera exactamente 30 ideas de video. Los datos deben ser realistas y variados.`
        },
        {
          role: 'user',
          content: `Genera un plan de contenido de 30 videos para el nicho "${safeNiche}" con audiencia "${safeAudience}"`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.plan) && parsed.plan.length > 0) {
        return NextResponse.json({ plan: parsed.plan, source: 'ai' });
      }
      return NextResponse.json(
        { error: 'La IA respondió en formato inesperado. Intenta de nuevo.', raw: content.substring(0, 200) },
        { status: 502 }
      );
    } catch {
      return NextResponse.json(
        { error: 'La IA no devolvió JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Content plan API error:', error);

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
      { error: 'Error al generar plan. Intenta de nuevo.', details: error?.message },
      { status: 500 }
    );
  }
}
