/**
 * NexScope — /api/doctor  (system health diagnostics, auth required)
 *
 *   GET /api/doctor
 *
 * Runs 10 ordered checks and returns:
 *   {
 *     timestamp: ISO string,
 *     version: '1.0.0',
 *     checks: Array<{ name, status: 'ok'|'warn'|'fail', message?, latencyMs? }>
 *   }
 *
 * Every check is wrapped in its own try/catch so that one failing check
 * can't cascade and abort the rest. Failures use `safeErrorMessage` to
 * avoid leaking internals to the response (dev mode still shows the
 * real message for debugging).
 *
 * The endpoint requires an authenticated session — the doctor should not
 * leak internal state to anonymous callers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fsPromises } from 'fs';
import path from 'path';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';
import { cacheSet, cacheGet, cacheClear, buildCacheKey } from '@/lib/cache';
import { TOOLS, toolsForPrompt } from '@/lib/agent/tools';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CheckResult {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message?: string;
  latencyMs?: number;
}

const APP_VERSION = '1.0.0';
const AI_PROBE_TIMEOUT_MS = 5000;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: time a check, convert errors to 'fail'
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function runCheck(
  name: string,
  fn: () => Promise<{ status: 'ok' | 'warn' | 'fail'; message?: string }>
): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    return {
      name,
      status: result.status,
      message: result.message,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name,
      status: 'fail',
      message: safeErrorMessage(error, `${name} falló`),
      latencyMs: Date.now() - startedAt,
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const checks: CheckResult[] = [];

  // Verify auth up-front so the doctor route itself is gated (the rest of
  // the checks rely on a valid user — `memory`, `auth` and `youtube_provider`
  // are user-scoped).
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 1) database — `SELECT 1` round-trip.
  checks.push(
    await runCheck('database', async () => {
      await db.$queryRaw`SELECT 1`;
      return { status: 'ok' as const, message: 'SELECT 1 OK' };
    })
  );

  // 2) auth — `getAuthenticatedUser` returned a non-null user (already
  // proved at the top of the handler, but re-run here for completeness
  // and to surface the latency of a fresh lookup).
  checks.push(
    await runCheck('auth', async () => {
      const u = await getAuthenticatedUser(request);
      if (!u) {
        return { status: 'fail' as const, message: 'getAuthenticatedUser devolvió null' };
      }
      return { status: 'ok' as const, message: `user=${u.email}` };
    })
  );

  // 3) youtube_provider — Setting table lookup, no API call.
  checks.push(
    await runCheck('youtube_provider', async () => {
      const setting = await db.setting.findUnique({
        where: { key: 'YOUTUBE_API_KEY' },
      });
      if (setting?.value) {
        return { status: 'ok' as const, message: 'YOUTUBE_API_KEY presente en DB' };
      }
      if (process.env.YOUTUBE_API_KEY) {
        return { status: 'ok' as const, message: 'YOUTUBE_API_KEY en env (no en DB)' };
      }
      return {
        status: 'warn' as const,
        message: 'YOUTUBE_API_KEY no configurada — herramientas de YouTube no operativas',
      };
    })
  );

  // 4) ai_provider — `ZAI.create()` + 1 tiny chat call, 5s timeout.
  checks.push(
    await runCheck('ai_provider', async () => {
      const zai = await ZAI.create();
      const probe = new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('AI probe timeout (5s)'));
        }, AI_PROBE_TIMEOUT_MS);
        zai
          .chat.completions.create({
            messages: [
              { role: 'system', content: 'Responde "ok".' },
              { role: 'user', content: 'ping' },
            ],
          })
          .then((res: { choices?: Array<{ message?: { content?: string } }> }) => {
            clearTimeout(timer);
            resolve(res?.choices?.[0]?.message?.content || '');
          })
          .catch((err: unknown) => {
            clearTimeout(timer);
            reject(err);
          });
      });
      const content = await probe;
      return {
        status: 'ok' as const,
        message: `AI respondió (${content.slice(0, 30) || 'vacío'})`,
      };
    })
  );

  // 5) cache — set+get+clear a probe key (no cacheDelete in the module).
  checks.push(
    await runCheck('cache', async () => {
      const probeKey = buildCacheKey('doctor', 'probe', user.id);
      const probeValue = `probe-${Date.now()}`;
      cacheSet(probeKey, probeValue, 60_000);
      const got = cacheGet<string>(probeKey);
      cacheClear();
      if (got !== probeValue) {
        return { status: 'fail' as const, message: 'cache round-trip no coincide' };
      }
      return { status: 'ok' as const, message: 'set+get+clear OK' };
    })
  );

  // 6) agent_runtime — TOOLS populated and toolsForPrompt non-empty.
  checks.push(
    await runCheck('agent_runtime', async () => {
      if (!Array.isArray(TOOLS) || TOOLS.length === 0) {
        return { status: 'fail' as const, message: 'TOOLS vacío' };
      }
      const summary = toolsForPrompt();
      if (!summary || summary.trim().length === 0) {
        return { status: 'fail' as const, message: 'toolsForPrompt devolvió vacío' };
      }
      return { status: 'ok' as const, message: `TOOLS=${TOOLS.length}, summary=${summary.length} chars` };
    })
  );

  // 7) memory — count rows for the authenticated user (table-exists probe).
  checks.push(
    await runCheck('memory', async () => {
      const count = await db.memory.count({ where: { userId: user.id } });
      return { status: 'ok' as const, message: `user memories=${count}` };
    })
  );

  // 8) mcp — verify the MCP route file exists on disk.
  checks.push(
    await runCheck('mcp', async () => {
      const mcpPath = path.join(
        process.cwd(),
        'src',
        'app',
        'api',
        'mcp',
        'route.ts'
      );
      try {
        const stat = await fsPromises.stat(mcpPath);
        if (!stat.isFile()) {
          return { status: 'fail' as const, message: 'mcp/route.ts no es un archivo' };
        }
        return { status: 'ok' as const, message: 'mcp/route.ts presente' };
      } catch {
        return {
          status: 'fail' as const,
          message: 'mcp/route.ts no encontrado',
        };
      }
    })
  );

  // 9) environment — NODE_ENV + DATABASE_URL non-empty.
  checks.push(
    await runCheck('environment', async () => {
      const nodeEnv = process.env.NODE_ENV || '';
      const dbUrl = process.env.DATABASE_URL || '';
      if (!nodeEnv) {
        return { status: 'fail' as const, message: 'NODE_ENV vacío' };
      }
      if (!dbUrl) {
        return { status: 'fail' as const, message: 'DATABASE_URL vacío' };
      }
      return {
        status: 'ok' as const,
        message: `NODE_ENV=${nodeEnv}, DATABASE_URL=${dbUrl.slice(0, 12)}…`,
      };
    })
  );

  // 10) build — `.next/` directory present.
  checks.push(
    await runCheck('build', async () => {
      const nextDir = path.join(process.cwd(), '.next');
      try {
        const stat = await fsPromises.stat(nextDir);
        if (!stat.isDirectory()) {
          return { status: 'warn' as const, message: '.next existe pero no es directorio' };
        }
        return { status: 'ok' as const, message: '.next/ presente' };
      } catch {
        return {
          status: 'warn' as const,
          message: '.next/ no existe (ejecuta `npm run build` para producción)',
        };
      }
    })
  );

  // Aggregate-check errors are not fatal — log them so the server log has
  // the full picture even though the response only returns the summary.
  const failed = checks.filter((c) => c.status === 'fail');
  if (failed.length > 0) {
    logError('doctor', `${failed.length} check(s) failed: ${failed.map((c) => c.name).join(', ')}`);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    totalLatencyMs: Date.now() - startedAt,
    checks,
  });
}
