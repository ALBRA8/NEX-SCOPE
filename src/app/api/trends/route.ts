import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';
import { cacheGet, cacheSet, buildCacheKey } from '@/lib/cache';

// AI calls take 5–95 s; cache by (niche, region) for 90 s so that multiple
// authenticated users hitting the same query within the window share the
// result. See src/lib/cache.ts for trade-offs (single-instance only).
const TRENDS_CACHE_TTL_MS = 90_000;

export async function POST(req: NextRequest) {
  // ━━ Auth gate — AI calls cost money; do not allow anonymous access. ━━
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
    const { niche, region } = body;
    const safeNiche = (niche || '').toString().trim().slice(0, 200);
    const safeRegion = (region || 'ES').toString().trim().slice(0, 10);

    const cacheKey = buildCacheKey('trends', safeNiche, safeRegion);
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: 'ai', cached: true });
    }

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
      cacheSet(cacheKey, parsed, TRENDS_CACHE_TTL_MS);
      return NextResponse.json({ ...parsed, source: 'ai' });
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    logError('Trends API', error);
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
    return NextResponse.json({ error: 'Error al generar tendencias.' }, { status: 500 });
  }
}
