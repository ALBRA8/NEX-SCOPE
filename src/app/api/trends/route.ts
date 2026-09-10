import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';

export async function POST(req: NextRequest) {
  try {
    const { niche, region } = await req.json();
    const safeNiche = (niche || '').toString().trim();
    const safeRegion = (region || 'ES').toString().trim();

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un analista de tendencias de YouTube. Cuando se te da un nicho o categoría, devuelves UNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "trends": [
    {
      "name": "nombre del nicho tendencia",
      "category": "categoría",
      "growthRate": porcentaje_de_crecimiento,
      "trendVelocity": velocidad_del_1_al_100,
      "nicheScore": puntuacion_del_1_al_100,
      "monthlySearchVolume": volumen_mensual,
      "estimatedRPM": rpm_estimado_en_dolares,
      "competitionLevel": "bajo|medio|alto",
      "description": "breve descripción"
    }
  ],
  "trendData": [
    {"month": "Ene", "Tecnología": numero, "Finanzas": numero, "Salud": numero, "Gaming": numero, "Educación": numero, "Cocina": numero}
  ]
}
Genera exactamente 12 tendencias relevantes${safeNiche ? ` para el área de "${safeNiche}"` : ''}. Los 12 objetos en trendData corresponden a los últimos 12 meses (Ene-Dic). Los valores deben ser realistas para YouTube en español en la región ${safeRegion}.`
        },
        {
          role: 'user',
          content: safeNiche
            ? `Genera tendencias de YouTube para el área: ${safeNiche}`
            : 'Genera las principales tendencias de YouTube en español ahora'
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    const parsed = extractJson(content);
    if (parsed && Array.isArray(parsed.trends) && parsed.trends.length > 0) {
      return NextResponse.json({ ...parsed, source: 'ai' });
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Trends API error:', error);
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
    return NextResponse.json({ error: 'Error al generar tendencias.', details: error?.message }, { status: 500 });
  }
}
