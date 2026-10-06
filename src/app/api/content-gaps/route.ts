import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';
import { aiProvenance, wrapWithProvenance } from '@/lib/provenance';

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
    const { niche } = body;
    // Require niche instead of silently falling back to a default — silent
    // fallbacks let anonymous callers burn AI quota with empty payloads.
    const safeNiche = (niche || '').toString().trim().slice(0, 200);
    if (!safeNiche) {
      return NextResponse.json({ error: 'El nicho es requerido' }, { status: 400 });
    }

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
Devuelve exactamente 8 brechas de contenido.

IMPORTANTE: Los valores de searchVolume y existingVideos son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de YouTube. Genéralos como hipótesis razonables basadas en tu conocimiento del nicho, pero recuerda que son estimaciones, no hechos verificables.`
        },
        {
          role: 'user',
          content: `Analiza las brechas de contenido para el nicho: ${safeNiche}`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    const parsed = extractJson(content);
    if (parsed && Array.isArray(parsed.gaps) && parsed.gaps.length > 0) {
      return NextResponse.json(wrapWithProvenance({ gaps: parsed.gaps, source: 'ai' }, aiProvenance()));
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    logError('Content gaps API', error);
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
      { error: 'Error al analizar brechas. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
