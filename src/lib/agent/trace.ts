/**
 * NexScope — Agent Execution Trace helpers.
 *
 * Each agent invocation gets a single ExecutionTrace row that records:
 *   - the task (user message),
 *   - the ordered list of tool calls with their ok/error status,
 *   - the final outputs / errors,
 *   - timing (startTime + endTime).
 *
 * `startTrace` creates the row with status='running'.
 * `appendToolCall` pushes a tool call entry to the in-memory `tools` array
 *   and persists it back to the row (cheap updateMany of the JSON column).
 * `finishTrace` sets `status`, `endTime`, `outputs` and `errors`.
 *
 * The helpers never throw — they catch DB errors and log them so a tracing
 * failure can never break the agent loop. Trace persistence is best-effort.
 */

import { db } from '@/lib/db';
import { logError } from '@/lib/errors';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ToolCallEntry {
  name: string;
  args: unknown;
  ok: boolean;
  error?: string;
  /** Set by appendToolCall from Date.now() — when the call finished. */
  ts?: number;
}

export interface TraceContext {
  traceId: string;
  userId: string;
  /** In-memory accumulator for tool calls; persisted on each append. */
  tools: ToolCallEntry[];
  /** Wall-clock at startTrace time (ms epoch). */
  startTime: number;
  /** The original task string (kept for logging on error paths). */
  task: string;
}

type FinishStatus = 'completed' | 'error' | 'aborted';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create a new ExecutionTrace row with status='running'.
 *
 * Best-effort: if the DB insert fails (e.g. table missing, schema drift),
 * we return a context with a sentinel `traceId='trace:disabled'` so the
 * rest of the agent loop can keep running. Subsequent `appendToolCall` /
 * `finishTrace` calls become no-ops in that case.
 */
export async function startTrace(
  userId: string,
  task: string
): Promise<TraceContext> {
  const ctx: TraceContext = {
    traceId: 'trace:disabled',
    userId,
    tools: [],
    startTime: Date.now(),
    task: String(task || '').slice(0, 6000),
  };
  if (!userId) return ctx;

  try {
    const row = await db.executionTrace.create({
      data: {
        userId,
        task: ctx.task,
        tools: '[]',
        status: 'running',
        startTime: new Date(ctx.startTime),
        inputs: JSON.stringify({ task: ctx.task }),
      },
    });
    ctx.traceId = row.id;
  } catch (err) {
    logError('startTrace', err);
  }
  return ctx;
}

/**
 * Append a tool call entry to the trace. Persists the updated `tools` JSON
 * array back to the row so that even if the agent crashes mid-loop, the
 * partial trace survives.
 */
export async function appendToolCall(
  ctx: TraceContext,
  call: {
    name: string;
    args: unknown;
    ok: boolean;
    error?: string;
  }
): Promise<void> {
  // Always update the in-memory accumulator (used by finishTrace too).
  ctx.tools.push({
    name: String(call.name || 'unknown'),
    args: call.args,
    ok: Boolean(call.ok),
    error: call.error,
    ts: Date.now(),
  });

  if (!ctx.traceId || ctx.traceId === 'trace:disabled') return;

  // Prune large args (e.g. big AI results) before persisting — keep the
  // trace row compact. The full args are already in the SSE stream / agent
  // output, the trace just needs enough for replay/debugging.
  const compact = ctx.tools.map((t) => ({
    name: t.name,
    ok: t.ok,
    error: t.error,
    ts: t.ts,
    argsPreview: stringifyPreview(t.args, 500),
  }));

  try {
    await db.executionTrace.update({
      where: { id: ctx.traceId },
      data: { tools: JSON.stringify(compact) },
    });
  } catch (err) {
    logError('appendToolCall', err);
  }
}

/**
 * Mark the trace as finished. Sets `status`, `endTime`, `outputs`, `errors`.
 *
 * `outputs` is typically the agent's final message string (or the structured
 * result of the last tool). `errors` is the failure reason on error/aborted
 * paths.
 */
export async function finishTrace(
  ctx: TraceContext,
  status: FinishStatus,
  outputs?: unknown,
  errors?: unknown
): Promise<void> {
  if (!ctx.traceId || ctx.traceId === 'trace:disabled') return;

  try {
    await db.executionTrace.update({
      where: { id: ctx.traceId },
      data: {
        status,
        endTime: new Date(),
        outputs: outputs === undefined ? null : JSON.stringify(outputs),
        errors: errors === undefined ? null : JSON.stringify(errors),
      },
    });
  } catch (err) {
    logError('finishTrace', err);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERNAL HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Compact a tool's args (which can be a string, object, or array) into a
 * short JSON preview suitable for storing in the trace row.
 */
function stringifyPreview(value: unknown, maxLen: number): string {
  let s: string;
  try {
    s = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    s = String(value);
  }
  if (s.length > maxLen) return s.slice(0, maxLen) + '…';
  return s;
}
