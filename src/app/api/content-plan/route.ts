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
    const { niche, audience } = body;
    const safeNiche = (niche || '').toString().trim().slice(0, 200);
    const safeAudience = (audience || '').toString().trim().slice(0, 300);
    if (!safeNiche) {
      return NextResponse.json({ error: 'El nicho es requerido' }, { status: 400 });
    }

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

    const parsed = extractJson(content);
    if (parsed && Array.isArray(parsed.plan) && parsed.plan.length > 0) {
      return NextResponse.json({ plan: parsed.plan, source: 'ai' });
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    logError('Content plan API', error);
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
      { error: 'Error al generar plan. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
