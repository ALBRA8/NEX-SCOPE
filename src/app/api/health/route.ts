import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Cache the result for 60s to avoid hammering the upstream on every page load
let cachedAt = 0;
let cachedStatus: { available: boolean; error?: string; latencyMs?: number } = {
  available: false,
};

const CACHE_TTL_MS = 60_000;

export async function GET() {
  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...cachedStatus, cached: true });
  }

  const startedAt = Date.now();
  try {
    const zai = await ZAI.create();
    // Tiny probe: a one-token message. If this returns, Z.ai is up.
    await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Responde "ok".' },
        { role: 'user', content: 'ping' },
      ],
      // Some upstreams support max_tokens; safe to omit if ignored
    });
    cachedStatus = {
      available: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err: any) {
    cachedStatus = {
      available: false,
      error: err?.cause?.message || err?.message || 'Unknown error',
      latencyMs: Date.now() - startedAt,
    };
  }
  cachedAt = now;

  return NextResponse.json({ ...cachedStatus, cached: false });
}
