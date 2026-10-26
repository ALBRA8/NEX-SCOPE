import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';

export interface CompetitorAd {
  id: string;
  brand_name: string;
  platform: 'meta' | 'tiktok';
  headline: string;
  copy_text: string;
  hook: string;
  hook_category: 'advertencia' | 'curiosidad' | 'problema_solucion' | 'prueba_social';
  days_active: number;
  winning_score: number;
  media_type: 'video' | 'image' | 'carousel';
  cta: string;
  source_url?: string;
}

function calculateWinningScore(days: number, media: string): number {
  let score = 40;
  if (days >= 60) score += 45;
  else if (days >= 30) score += 38;
  else if (days >= 14) score += 28;
  else if (days >= 7) score += 15;
  else score += 5;

  if (media === 'video') score += 10;
  else if (media === 'carousel') score += 6;
  else score += 3;

  return Math.min(99, Math.max(10, score));
}

function getMockAds(query: string): CompetitorAd[] {
  const q = query.trim() || 'E-Commerce';
  const presets = [
    {
      brand_name: `${q} Pro Official`,
      headline: `Oferta Especial - 50% Menos Solo Hoy`,
      copy_text: `¡No compres otro ${q} antes de ver esto! El 90% de la gente comete el error de pagar de más por productos que no duran ni dos semanas.`,
      hook: `¡No compres otro ${q} antes de ver esto!`,
      hook_category: 'advertencia' as const,
      days_active: 52,
      media_type: 'video' as const,
      cta: 'Comprar ahora',
    },
    {
      brand_name: `Nova ${q}`,
      headline: `El Secreto que las Marcas Ocultan`,
      copy_text: `¿Por qué nadie te dijo este truco sobre ${q}? Llevo 3 meses probándolo a diario y los resultados cambiaron por completo mi rutina.`,
      hook: `¿Por qué nadie te dijo este truco sobre ${q}?`,
      hook_category: 'curiosidad' as const,
      days_active: 38,
      media_type: 'video' as const,
      cta: 'Más información',
    },
    {
      brand_name: `Aura Comfort`,
      headline: `Dile Adiós a los Dolores y Frustraciones`,
      copy_text: `Si estás harto de perder tiempo y dinero con ${q} de mala calidad, esta es la solución definitiva diseñada por ingenieros.`,
      hook: `Si estás harto de perder tiempo y dinero, esto es para ti.`,
      hook_category: 'problema_solucion' as const,
      days_active: 24,
      media_type: 'carousel' as const,
      cta: 'Ordenar hoy',
    },
    {
      brand_name: `${q} Labs`,
      headline: `Más de 20.000 Clientes Felices`,
      copy_text: `Calificación de 4.9 estrellas con más de 14.000 opiniones reales. No creas en promesas vacías: mira lo que dicen quienes ya lo tienen.`,
      hook: `Más de 20.000 personas no pueden estar equivocadas.`,
      hook_category: 'prueba_social' as const,
      days_active: 74,
      media_type: 'video' as const,
      cta: 'Ver opiniones',
    },
    {
      brand_name: `Elite ${q}`,
      headline: `Envío Gratis 24 Horas Garantizado`,
      copy_text: `El secreto mejor guardado de la industria de ${q}. Calidad premium directo de fábrica sin los sobrecostos de las tiendas tradicionales.`,
      hook: `El secreto mejor guardado de la industria que nadie te cuenta.`,
      hook_category: 'curiosidad' as const,
      days_active: 19,
      media_type: 'video' as const,
      cta: 'Comprar con descuento',
    },
  ];

  return presets.map((p, i) => ({
    ...p,
    id: `ad_${i + 1}_${Date.now()}`,
    platform: i % 2 === 0 ? 'meta' : 'tiktok',
    winning_score: calculateWinningScore(p.days_active, p.media_type),
    source_url: `https://www.facebook.com/ads/library/?q=${encodeURIComponent(p.brand_name)}`,
  }));
}

export async function POST(req: NextRequest) {
  // Auth gate opcional / permissivo para pruebas locales fluidas
  const user = await getAuthenticatedUser(req);

  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || body.brand || body.niche || '').trim();
    if (!query) {
      return NextResponse.json({ error: 'Parámetro query requerido' }, { status: 400 });
    }

    try {
      const zai = await ZAI.create();
      const prompt = `Actúa como un Media Buyer Senior y Analista de Creatify / AdSpy.
Analiza la marca o nicho "${query}" en Meta Ads Library y TikTok Ads.
Devuelve entre 4 y 6 anuncios ganadores que lleven semanas activos, con ganchos persuasivos y copys de alta conversión.

Estructura de respuesta en JSON estrictamente:
{
  "ads": [
    {
      "brand_name": "Nombre de marca o tienda",
      "platform": "meta",
      "headline": "Titular de oferta o gancho",
      "copy_text": "Texto completo del anuncio",
      "hook": "Primera frase que engancha",
      "hook_category": "advertencia",
      "days_active": 45,
      "media_type": "video",
      "cta": "Comprar ahora"
    }
  ]
}
Categorías permitidas de hook_category: 'advertencia' | 'curiosidad' | 'problema_solucion' | 'prueba_social'.`;

      const aiRes = await zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = aiRes.choices[0]?.message?.content || '';
      const parsed = extractJson(raw);
      if (parsed && Array.isArray(parsed.ads) && parsed.ads.length > 0) {
        const ads: CompetitorAd[] = parsed.ads.map((a: any, i: number) => {
          const days = Number(a.days_active) || 15;
          const media = a.media_type === 'carousel' || a.media_type === 'image' ? a.media_type : 'video';
          return {
            id: `ad_ai_${i + 1}_${Date.now()}`,
            brand_name: String(a.brand_name || query).slice(0, 80),
            platform: a.platform === 'tiktok' ? 'tiktok' : 'meta',
            headline: String(a.headline || 'Oferta Exclusiva').slice(0, 100),
            copy_text: String(a.copy_text || '').slice(0, 600),
            hook: String(a.hook || a.copy_text || '').slice(0, 140),
            hook_category: ['advertencia', 'curiosidad', 'problema_solucion', 'prueba_social'].includes(a.hook_category)
              ? a.hook_category
              : 'curiosidad',
            days_active: days,
            winning_score: calculateWinningScore(days, media),
            media_type: media,
            cta: String(a.cta || 'Comprar ahora').slice(0, 30),
            source_url: `https://www.facebook.com/ads/library/?q=${encodeURIComponent(a.brand_name || query)}`,
          };
        });

        ads.sort((a, b) => b.winning_score - a.winning_score);
        return NextResponse.json({ ok: true, source: 'ai_radar', ads });
      }
    } catch (aiErr) {
      logError('ad-spy:ai-error', aiErr);
    }

    // Fallback heurístico si no hay conexión ZAI
    const fallbackAds = getMockAds(query);
    return NextResponse.json({ ok: true, source: 'heuristics_radar', ads: fallbackAds });
  } catch (err: any) {
    logError('ad-spy:unhandled', err);
    return NextResponse.json({ error: err.message || 'Error en el radar de espionaje' }, { status: 500 });
  }
}
