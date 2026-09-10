import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';

export async function POST(req: NextRequest) {
  try {
    const { niche, subscribers, viewsPerMonth } = await req.json();
    const safeNiche = (niche || '').toString().trim();
    const safeSubs = Number(subscribers) || 50000;
    const safeViews = Number(viewsPerMonth) || 200000;

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
Los valores deben ser realistas para YouTube en español. Incluye 10 nichos en rpmByNiche (los más populares en YouTube español). Los porcentajes en revenueBreakdown deben sumar 100.`
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
      return NextResponse.json({ ...parsed, source: 'ai' });
    }
    return NextResponse.json(
      { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.', raw: content.substring(0, 200) },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Monetization API error:', error);
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
    return NextResponse.json({ error: 'Error al calcular monetización.', details: error?.message }, { status: 500 });
  }
}
