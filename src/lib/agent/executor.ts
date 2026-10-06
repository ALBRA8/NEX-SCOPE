/**
 * NexScope Agent — ReAct executor (prompt-based tool calling)
 *
 * The LLM decides when to call a tool by emitting a specially-marked block
 * inside its response:
 *
 *   [[TOOL_CALL]]
 *   {"name":"...","args":{...}}
 *   [[END_TOOL_CALL]]
 *
 * The loop parses that block, runs the tool via `executeTool`, feeds the
 * result back into the conversation as a user message, and lets the LLM
 * continue. Up to MAX_ITERATIONS rounds. When the LLM stops emitting tool
 * calls, its final response is yielded as a `message` event.
 *
 * Used by POST /api/agent (SSE stream).
 */

import ZAI from 'z-ai-web-dev-sdk';
import { executeTool, toolsForPrompt, type ToolContext } from './tools';
import { extractJson } from '@/lib/extract-json';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AgentEvent =
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; ok: boolean; result?: unknown; error?: string }
  | { type: 'message'; content: string }
  | { type: 'error'; message: string; code?: string }
  | { type: 'done' };

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MAX_ITERATIONS = 10;
const MAX_CONTENT = 6000;
const MAX_HISTORY = 20;
const MAX_TOOL_RESULT = 4000;

const TOOL_CALL_OPEN = '[[TOOL_CALL]]';
const TOOL_CALL_CLOSE = '[[END_TOOL_CALL]]';
// Match the block between [[TOOL_CALL]] and [[END_TOOL_CALL]] (non-greedy,
// dot-all). Capture group 1 is the inner JSON payload.
const TOOL_CALL_REGEX = /\[\[TOOL_CALL\]\]\s*([\s\S]*?)\s*\[\[END_TOOL_CALL\]\]/;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT (built at runtime to embed the tool list)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildSystemPrompt(): string {
  return [
    'Eres NexScope Agent, un asistente conversacional que AYUDA A OPERAR EL SISTEMA. Puedes usar herramientas para leer datos, generar contenido con IA, buscar en YouTube y guardar items en la cuenta del usuario.',
    '',
    'Herramientas disponibles:',
    toolsForPrompt(),
    '',
    'Reglas:',
    `- Para usar una herramienta, responde EXACTAMENTE con este formato: la secuencia de apertura ${TOOL_CALL_OPEN} seguida de un JSON con \`{"name":"...","args":{...}}\` y la secuencia de cierre ${TOOL_CALL_CLOSE}. No agregues texto antes ni después en esa línea.`,
    '- Si tienes toda la información que necesitas, responde en texto natural sin usar tool_call.',
    '- Si una herramienta devuelve un error, intenta recuperarte o explica el problema al usuario.',
    '- Máximo 10 iteraciones. Si necesitas más, resume y responde.',
    '- Responde SIEMPRE en español.',
    '- Sé conciso pero completo. Usa markdown para listas/tablas cuando sea útil.',
  ].join('\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL CALL PARSER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Extract a tool call from the LLM's response.
 *
 * Looks for a `[[TOOL_CALL]] ... [[END_TOOL_CALL]]` block, parses the inner
 * JSON (with `extractJson` as a fallback for markdown fences / preamble),
 * and returns `{name, args}` only if `name` is a non-empty string and `args`
 * is a plain object. Returns `null` if no valid tool call is present (in
 * which case the response is treated as a final message to the user).
 */
function parseToolCall(content: string): ToolCall | null {
  if (!content || typeof content !== 'string') return null;

  const match = content.match(TOOL_CALL_REGEX);
  if (!match) return null;

  const raw = (match[1] || '').trim();
  if (!raw) return null;

  // Try strict JSON first; fall back to extractJson for messy output.
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = extractJson<unknown>(raw);
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const obj = parsed as Record<string, unknown>;
  const name = obj.name;
  const args = obj.args;

  if (typeof name !== 'string' || !name.trim()) return null;
  // args must be a plain object (not null, not array, not primitive).
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return null;
  }

  return { name: name.trim(), args: args as Record<string, unknown> };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AGENT LOOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Run the NexScope agent loop.
 *
 * Yields a stream of `AgentEvent`s that the caller (typically the SSE
 * endpoint) forwards to the client. The loop terminates when either:
 *  - the LLM responds without a tool call (yields `message` + `done`), or
 *  - the loop exhausts MAX_ITERATIONS (yields `error`).
 *
 * Errors from the underlying AI call are not caught here — the caller is
 * expected to wrap the `for await` in a try/catch (see route.ts).
 */
export async function* runAgent(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  ctx: ToolContext
): AsyncGenerator<AgentEvent> {
  // Sanitize and cap history: keep only the last MAX_HISTORY entries with
  // string content, truncating each to MAX_CONTENT chars.
  const safeHistory: ChatMessage[] = (Array.isArray(history) ? history : [])
    .filter((m) => m && typeof m === 'object' && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as ChatMessage['role'],
      content: m.content.slice(0, MAX_CONTENT),
    }));

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...safeHistory,
    { role: 'user', content: String(userMessage || '').slice(0, MAX_CONTENT) },
  ];

  const zai = await ZAI.create();

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await zai.chat.completions.create({ messages });
    const content = response?.choices?.[0]?.message?.content || '';

    const toolCall = parseToolCall(content);

    if (!toolCall) {
      // No tool call → this is the LLM's final answer to the user.
      yield { type: 'message', content };
      yield { type: 'done' };
      return;
    }

    // Announce the call, run the tool, announce the result.
    yield { type: 'tool_call', name: toolCall.name, args: toolCall.args };
    const exec = await executeTool(toolCall.name, toolCall.args, ctx);
    if (exec.ok) {
      yield { type: 'tool_result', name: toolCall.name, ok: true, result: exec.result };
    } else {
      yield { type: 'tool_result', name: toolCall.name, ok: false, error: exec.error };
    }

    // Feed the assistant's original response and the tool result back into
    // the conversation so the LLM can decide what to do next.
    messages.push({
      role: 'assistant',
      content: content.slice(0, MAX_CONTENT),
    });
    messages.push({
      role: 'user',
      content: `Resultado de la herramienta ${toolCall.name}:\n${JSON.stringify(exec).slice(0, MAX_TOOL_RESULT)}\n\nContinúa: usa otra herramienta si lo necesitas, o responde al usuario.`,
    });
  }

  // Ran out of iterations without a final answer.
  yield { type: 'error', message: 'El agente alcanzó el máximo de iteraciones.' };
}
