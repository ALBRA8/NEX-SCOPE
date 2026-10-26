import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errors';

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger_source: 'winning_products' | 'breakout_channels' | 'ad_spy' | 'viral_sounds';
  condition_label: string;
  target_type: 'youtube_automation' | 'external_webhook';
  target_url: string;
  target_format: 'short' | 'long';
  total_dispatches: number;
  last_dispatched_at: string | null;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  rule_name: string;
  target_url: string;
  status: 'success' | 'failed';
  status_code: number;
  response_time_ms: number;
  message: string;
  payload_summary: string;
  timestamp: string;
}

// Estado en memoria para la sesión
let RULES_DB: AutomationRule[] = [
  {
    id: 'rule_1',
    name: '🚀 Auto-Fábrica: Productos Ganadores > 60% Margen',
    enabled: true,
    trigger_source: 'winning_products',
    condition_label: 'Margen de Ganancia >= 60% & Saturación Baja',
    target_type: 'youtube_automation',
    target_url: 'http://127.0.0.1:8000/api/quick-create',
    target_format: 'short',
    total_dispatches: 14,
    last_dispatched_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rule_2',
    name: '🔥 Alerta Outliers Vanta: Canales < 60d con > 15x',
    enabled: true,
    trigger_source: 'breakout_channels',
    condition_label: 'Antigüedad < 60 días & Multiplicador Outlier >= 15x',
    target_type: 'external_webhook',
    target_url: 'https://discord.com/api/webhooks/mock-n8n-alert',
    target_format: 'short',
    total_dispatches: 8,
    last_dispatched_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rule_3',
    name: '🎵 Tendencias TikTok: Crecimiento Semanal > 200%',
    enabled: false,
    trigger_source: 'viral_sounds',
    condition_label: 'Crecimiento de Audio >= +200% semanal',
    target_type: 'youtube_automation',
    target_url: 'http://127.0.0.1:8000/api/quick-create',
    target_format: 'short',
    total_dispatches: 3,
    last_dispatched_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

let LOGS_DB: AutomationLog[] = [
  {
    id: 'log_1',
    rule_id: 'rule_1',
    rule_name: 'Auto-Fábrica: Productos Ganadores > 60% Margen',
    target_url: 'http://127.0.0.1:8000/api/quick-create',
    status: 'success',
    status_code: 200,
    response_time_ms: 124,
    message: 'Proyecto de video short recibido y encolado en YouTube Automation.',
    payload_summary: 'Producto: Cafetera Espresso OutIn ($64.99) · 62% Margen',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log_2',
    rule_id: 'rule_2',
    rule_name: 'Alerta Outliers Vanta: Canales < 60d con > 15x',
    target_url: 'https://discord.com/api/webhooks/mock-n8n-alert',
    status: 'success',
    status_code: 200,
    response_time_ms: 210,
    message: 'Webhook recibido y despachado exitosamente.',
    payload_summary: 'Canal: Cronos Misterios AI (41 días) · Outlier 18.6x',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    rules: RULES_DB,
    recent_logs: LOGS_DB,
    automation_engine_status: 'online',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, rule_id, rule } = body;

    if (action === 'toggle' && rule_id) {
      RULES_DB = RULES_DB.map((r) =>
        r.id === rule_id ? { ...r, enabled: !r.enabled } : r
      );
      return NextResponse.json({ ok: true, rules: RULES_DB });
    }

    if (action === 'create' && rule) {
      const newRule: AutomationRule = {
        id: `rule_${Date.now()}`,
        name: rule.name || 'Nueva Regla Automatizada',
        enabled: true,
        trigger_source: rule.trigger_source || 'winning_products',
        condition_label: rule.condition_label || 'Condición personalizada',
        target_type: rule.target_type || 'youtube_automation',
        target_url:
          rule.target_url ||
          (rule.target_type === 'youtube_automation'
            ? 'http://127.0.0.1:8000/api/quick-create'
            : 'https://discord.com/api/webhooks/...'),
        target_format: rule.target_format || 'short',
        total_dispatches: 0,
        last_dispatched_at: null,
        created_at: new Date().toISOString(),
      };
      RULES_DB.unshift(newRule);
      return NextResponse.json({ ok: true, rule: newRule, rules: RULES_DB });
    }

    if (action === 'delete' && rule_id) {
      RULES_DB = RULES_DB.filter((r) => r.id !== rule_id);
      return NextResponse.json({ ok: true, rules: RULES_DB });
    }

    return NextResponse.json({ ok: true, rules: RULES_DB });
  } catch (err: any) {
    logError('automations:route-error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
