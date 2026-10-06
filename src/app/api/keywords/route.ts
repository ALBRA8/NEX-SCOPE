import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';
import { cacheGet, cacheSet, buildCacheKey } from '@/lib/cache';
import { aiProvenance, wrapWithProvenance } from '@/lib/provenance';

// AI calls take 5–30 s; cache by niche for 30 s so multiple authenticated
// users hitting the same query share the result. Short TTL keeps freshness
// acceptable. See src/lib/cache.ts for trade-offs (single-instance only).
const KEYWORDS_CACHE_TTL_MS = 30_000;

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
    const { niche } = body;
    const safeNiche = (niche || '').toString().trim().slice(0, 200);
    if (!safeNiche) {
      return NextResponse.json({ error: 'El nicho es requerido' }, { status: 400 });
    }

    const cacheKey = buildCacheKey('keywords', safeNiche);
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ keywords: cached.keywords, source: 'ai', cached: true });
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
Genera exactamente 15 keywords relevantes para el nicho dado.

IMPORTANTE: Los valores de volume, competition, cpc y trend son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de Google/YouTube. Genéralos como hipótesis razonables basadas en tu conocimiento del nicho, pero recuerda que son estimaciones, no hechos verificables.`
        },
        {
          role: 'user',
          content: `Genera keywords para el nicho: ${safeNiche}`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    const parsed = extractJson(content);
    if (parsed && Array.isArray(parsed.keywords) && parsed.keywords.length > 0) {
      cacheSet(cacheKey, { keywords: parsed.keywords }, KEYWORDS_CACHE_TTL_MS);
      return NextResponse.json(wrapWithProvenance(
        { keywords: parsed.keywords, source: 'ai' },
        aiProvenance()
      ));
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    logError('Keywords API', error);
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
    return NextResponse.json(
      { error: 'Error al generar keywords.' },
      { status: 500 }
    );
  }
}
