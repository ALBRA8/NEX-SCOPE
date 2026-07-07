import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { niche } = await req.json();
    const safeNiche = (niche || '').toString().trim();
    if (!safeNiche) {
      return NextResponse.json({ error: 'El nicho es requerido' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un experto en SEO y marketing de contenido de YouTube. Cuando se te da un nicho, devuelves UNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "keywords": [
    {
      "keyword": "palabra clave",
      "volume": numero_estimado_busquedas_mensuales,
      "competition": porcentaje_0_a_100,
      "cpc": costo_por_clic_en_dolares,
      "trend": [numero_x12_meses],
      "relatedKeywords": ["kw1", "kw2", "kw3", "kw4"]
    }
  ]
}
Genera exactamente 15 keywords relevantes para el nicho dado. Los datos deben ser realistas. Los valores de trend representan el volumen mensual de búsqueda en los últimos 12 meses.`
        },
        {
          role: 'user',
          content: `Genera keywords para el nicho: ${safeNiche}`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.keywords) && parsed.keywords.length > 0) {
        return NextResponse.json({ keywords: parsed.keywords, source: 'ai' });
      }
      return NextResponse.json(
        { error: 'La IA respondió en formato inesperado. Intenta de nuevo.' },
        { status: 502 }
      );
    } catch {
      return NextResponse.json(
        { error: 'La IA no devolvió JSON válido. Intenta de nuevo.' },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Keywords API error:', error);
    const isNetworkError =
      error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.cause?.code === 'ECONNREFUSED' ||
      error?.name === 'TypeError' ||
      /fetch failed|connect timeout|network/i.test(error?.message || '');
    if (isNetworkError) {
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible en este entorno.', code: 'AI_UNAVAILABLE' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Error al generar keywords.', details: error?.message }, { status: 500 });
  }
}
