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
    const { niche, subscribers, viewsPerMonth } = body;
    const safeNiche = (niche || '').toString().trim().slice(0, 200);
    const safeSubs = Number.isFinite(Number(subscribers)) ? Number(subscribers) : 50000;
    const safeViews = Number.isFinite(Number(viewsPerMonth)) ? Number(viewsPerMonth) : 200000;
    if (safeSubs < 0 || safeSubs > 1_000_000_000) {
      return NextResponse.json({ error: 'subscribers inválido' }, { status: 400 });
    }
    if (safeViews < 0 || safeViews > 10_000_000_000) {
      return NextResponse.json({ error: 'viewsPerMonth inválido' }, { status: 400 });
    }
    if (!safeNiche) {
      return NextResponse.json({ error: 'El nicho es requerido' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un analista financiero experto en monetización de canales de YouTube. Cuando se te da un nicho, suscriptores y vistas mensuales, devuelves UNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "rpm": numero_rpm_en_dolares,
  "cpm": numero_cpm_en_dolares,
  "monthlyRevenue": numero_ingreso_mensual_estimado,
  "annualRevenue": numero_ingreso_anual_estimado,
  "rpmByNiche": [
    {"niche": "nombre del nicho", "rpm": numero}
  ],
  "revenueBreakdown": [
    {"name": "Anuncios", "value": porcentaje, "color": "#10b981"},
    {"name": "Patrocinios", "value": porcentaje, "color": "#f59e0b"},
    {"name": "Afiliados", "value": porcentaje, "color": "#8b5cf6"},
    {"name": "Membresías", "value": porcentaje, "color": "#06b6d4"}
  ]
}
Los valores deben ser razonables para YouTube en español. Incluye 10 nichos en rpmByNiche (los más populares en YouTube español). Los porcentajes en revenueBreakdown deben sumar 100.

IMPORTANTE: Todos los valores numéricos (rpm, cpm, monthlyRevenue, annualRevenue, rpmByNiche) son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de YouTube Ads. Genéralos como hipótesis razonables basadas en rangos típico del nicho, pero recuerda que son estimaciones, no hechos verificables.`
        },
        {
          role: 'user',
          content: `Calcula la monetización para el nicho "${safeNiche}" con ${safeSubs} suscriptores y ${safeViews} vistas/mes.`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    const parsed = extractJson(content);
    if (parsed && parsed.rpm && parsed.monthlyRevenue) {
      return NextResponse.json(wrapWithProvenance({ ...parsed, source: 'ai' }, aiProvenance()));
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    logError('Monetization API', error);
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
    return NextResponse.json({ error: 'Error al calcular monetización.' }, { status: 500 });
  }
}
