import { NextResponse, NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getAuthenticatedUser } from '@/lib/auth';

// Cache the AI probe result for 60s to avoid hammering the upstream.
// Anonymous callers never read or write the cache (no cross-user leak).
let cachedAt = 0;
let cachedStatus: { available: boolean; error?: string; latencyMs?: number } = {
  available: false,
};

const CACHE_TTL_MS = 60_000;

export async function GET(request: NextRequest) {
  // Public health check returns OK without hitting Z.ai.
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({
      available: true,
      status: 'ok',
      auth: 'anonymous',
      cached: false,
    });
  }

  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...cachedStatus, cached: true });
  }

  const startedAt = Date.now();
  try {
    const zai = await ZAI.create();
    await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Responde "ok".' },
        { role: 'user', content: 'ping' },
      ],
    });
    cachedStatus = {
      available: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unknown error';
    cachedStatus = {
      available: false,
      error: msg,
      latencyMs: Date.now() - startedAt,
    };
  }
  cachedAt = now;

  return NextResponse.json({ ...cachedStatus, cached: false });
}
