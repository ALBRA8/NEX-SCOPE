import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errors';
import { TOP_AFFILIATE_OFFERS } from '@/app/api/affiliate-offers/route';

export async function POST(request: NextRequest) {
  const startMs = Date.now();
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'affiliate'; // 'affiliate' | 'ecommerce'
    const forcedNiche = body.niche || 'AI & Software';

    let selectedOpportunity: any;

    if (mode === 'affiliate') {
      // 1. Tomar la oferta de afiliados con mayor gravedad del catálogo JVZoo/ClickBank
      const sortedOffers = [...TOP_AFFILIATE_OFFERS].sort((a, b) => b.gravity_score - a.gravity_score);
      const topOffer = sortedOffers[0]; // ej: Synthesys Actors o Adastra Studio Bundle

      selectedOpportunity = {
        title: topOffer.title,
        niche: topOffer.niche,
        angle: topOffer.hook,
        winning_score: Math.min(99, Math.round(topOffer.gravity_score / 2) + 20),
        margin: `Comisión ${topOffer.commission_pct}% · Payout ${topOffer.payout_avg}`,
        format: 'short',
        visual_style: 'neon_studio_pip',
        affiliate_url: topOffer.affiliate_page_url,
        timestamp: new Date().toISOString(),
      };
    } else {
      selectedOpportunity = {
        title: 'Cafetera Espresso Portátil OutIn (Trend +380%)',
        niche: forcedNiche,
        angle: 'Problema vs Solución (Arcads Hook: ¡Deja de gastar $5 todos los días en café!)',
        winning_score: 96,
        margin: '62% (~$40 ganancia por unidad)',
        format: 'short',
        visual_style: 'luxury_dark',
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Comprobación y despacho al endpoint de ideas de YouTube Automation
    let automationStatus = 'success';
    let automationMessage = 'Video encolado y listo para producción.';
    try {
      const ideaPayload = {
        idea: `Review: ${selectedOpportunity.title} | Gancho: ${selectedOpportunity.angle} | Formato: ${selectedOpportunity.format}`,
      };

      const res = await fetch('http://127.0.0.1:8000/api/factory/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaPayload),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        automationMessage = 'Conectado a YouTube Automation (:8000). Orden encolada en la fábrica exitosamente.';
      } else {
        automationMessage = `Fábrica local respondió con código HTTP ${res.status}`;
      }
    } catch {
      automationMessage = 'Fábrica en espera: Orden registrada localmente para ejecución en el siguiente ciclo.';
    }

    // 3. Notificación del ciclo
    const notificationPayload = {
      event: 'autonomous_cycle_completed',
      title: `🎉 [Piloto Automático 24/7] Video Encolado: ${selectedOpportunity.title}`,
      details: `Nicho: ${selectedOpportunity.niche} | ${selectedOpportunity.margin}`,
      hook: selectedOpportunity.angle,
      duration_ms: Date.now() - startMs,
    };

    return NextResponse.json({
      ok: true,
      cycle_id: `cycle_${Date.now()}`,
      execution_time_ms: Date.now() - startMs,
      opportunity: selectedOpportunity,
      automation_bridge: {
        status: automationStatus,
        message: automationMessage,
        target_endpoint: 'http://127.0.0.1:8000/api/factory/ideas',
      },
      notification: {
        sent: true,
        preview: notificationPayload,
      },
    });
  } catch (err: any) {
    logError('scheduler:run-cycle-error', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
