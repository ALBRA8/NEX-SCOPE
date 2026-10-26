import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errors';

export interface SchedulerConfig {
  enabled: boolean;
  frequency: 'daily_08am' | 'every_12h' | 'every_6h';
  frequency_label: string;
  next_run_timestamp: string;
  preferred_niche: string;
  target_format: 'short' | 'long';
  max_videos_per_cycle: number;
  notify_webhook: string;
  stats: {
    total_cycles_run: number;
    total_videos_produced: number;
    successful_runs: number;
    failed_runs: number;
  };
}

let SCHEDULER_STATE: SchedulerConfig = {
  enabled: true,
  frequency: 'daily_08am',
  frequency_label: 'Diario a las 08:00 AM',
  next_run_timestamp: new Date(Date.now() + 3600000 * 6.5).toISOString(),
  preferred_niche: 'Todos los Nichos de Alto RPM',
  target_format: 'short',
  max_videos_per_cycle: 2,
  notify_webhook: 'https://discord.com/api/webhooks/mock-telegram-alert',
  stats: {
    total_cycles_run: 18,
    total_videos_produced: 36,
    successful_runs: 18,
    failed_runs: 0,
  },
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    config: SCHEDULER_STATE,
    cron_status: SCHEDULER_STATE.enabled ? 'active' : 'paused',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, updates } = body;

    if (action === 'toggle') {
      SCHEDULER_STATE.enabled = !SCHEDULER_STATE.enabled;
      return NextResponse.json({ ok: true, config: SCHEDULER_STATE });
    }

    if (action === 'update' && updates) {
      SCHEDULER_STATE = { ...SCHEDULER_STATE, ...updates };
      return NextResponse.json({ ok: true, config: SCHEDULER_STATE });
    }

    return NextResponse.json({ ok: true, config: SCHEDULER_STATE });
  } catch (err: any) {
    logError('scheduler:error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
