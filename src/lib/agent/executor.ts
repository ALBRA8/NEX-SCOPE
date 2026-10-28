/**
 * NexScope Agent — ReAct executor (prompt-based tool calling)
 * Paridad con ALBRA AGENT SEED V1.0 (AGENTE-GENERAL)
 *
 * El LLM decide cuándo llamar a una herramienta emitiendo un bloque especial:
 *
 *   [[TOOL_CALL]]
 *   {"name":"...","args":{...}}
 *   [[END_TOOL_CALL]]
 *
 * Soporta múltiples proveedores (Groq, NVIDIA NIM, OpenAI, Z.ai) mediante
 * `callLLM` y hereda la identidad configurable del sistema.
 */

import { callLLM } from './providers';
import { getAgentIdentity, type AgentIdentity } from './identity';
import { executeTool, toolsForPrompt, type ToolContext } from './tools';
import { extractJson } from '@/lib/extract-json';
import { startTrace, appendToolCall, finishTrace, type TraceContext } from './trace';

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
const TOOL_CALL_REGEX = /\[\[TOOL_CALL\]\]\s*([\s\S]*?)\s*\[\[END_TOOL_CALL\]\]/;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildSystemPrompt(identity: AgentIdentity): string {
  return [
    `Eres ${identity.name}, ${identity.role}.`,
    identity.system_instructions || '',
    '',
    `REGLA CRÍTICA DE IDENTIDAD: No te identifiques como Claude, ChatGPT, GLM, ni ningún otro modelo de lenguaje. Tu nombre es ${identity.name}.`,
    '',
    'Herramientas disponibles para operar el sistema:',
    toolsForPrompt(),
    '',
    'Reglas de ejecución:',
    `- Para usar una herramienta, responde EXACTAMENTE con este formato: la secuencia ${TOOL_CALL_OPEN} seguida de un JSON con \`{"name":"...","args":{...}}\` y ${TOOL_CALL_CLOSE}. No agregues texto antes ni después en esa línea.`,
    '- Si tienes toda la información que necesitas, responde en texto natural al usuario sin usar tool_call.',
    '- Si una herramienta devuelve un error, intenta corregir los argumentos o explica el problema al usuario.',
    '- Responde SIEMPRE en español.',
    '- Sé conciso, analítico y profesional. Usa markdown para listas y tablas cuando sea útil.',
  ].join('\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL CALL PARSER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseToolCall(content: string): ToolCall | null {
  if (!content || typeof content !== 'string') return null;

  const match = content.match(TOOL_CALL_REGEX);
  if (!match) return null;

  const raw = (match[1] || '').trim();
  if (!raw) return null;

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
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return null;
  }

  return { name: name.trim(), args: args as Record<string, unknown> };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AGENT LOOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function* runAgent(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  ctx: ToolContext
): AsyncGenerator<AgentEvent> {
  const safeHistory: ChatMessage[] = (Array.isArray(history) ? history : [])
    .filter((m) => m && typeof m === 'object' && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as ChatMessage['role'],
      content: m.content.slice(0, MAX_CONTENT),
    }));

  const safeUserMessage = String(userMessage || '').slice(0, MAX_CONTENT);

  // Cargar identidad dinámica del agente (paridad con AGENTE-GENERAL)
  const identity = await getAgentIdentity();

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(identity) },
    ...safeHistory,
    { role: 'user', content: safeUserMessage },
  ];

  const trace: TraceContext = await startTrace(ctx.userId, safeUserMessage);

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      let content = '';
      try {
        content = await callLLM(messages);
      } catch (aiError) {
        await finishTrace(
          trace,
          'error',
          undefined,
          { message: aiError instanceof Error ? aiError.message : String(aiError), phase: 'ai_call', iteration: i }
        );
        throw aiError;
      }

      const toolCall = parseToolCall(content);

      if (!toolCall) {
        // Respuesta final del LLM
        await finishTrace(trace, 'completed', { message: content, iterations: i + 1 });
        yield { type: 'message', content };
        yield { type: 'done' };
        return;
      }

      // Anunciar llamada a herramienta
      yield { type: 'tool_call', name: toolCall.name, args: toolCall.args };
      const exec = await executeTool(toolCall.name, toolCall.args, ctx);

      // Registrar en la traza
      await appendToolCall(trace, {
        name: toolCall.name,
        args: toolCall.args,
        ok: exec.ok,
        error: exec.ok ? undefined : exec.error,
      });

      // Anunciar resultado
      if (exec.ok) {
        yield { type: 'tool_result', name: toolCall.name, ok: true, result: exec.result };
      } else {
        yield { type: 'tool_result', name: toolCall.name, ok: false, error: exec.error };
      }

      // Inyectar en el historial de conversación
      messages.push({
        role: 'assistant',
        content: `${TOOL_CALL_OPEN}\n${JSON.stringify({ name: toolCall.name, args: toolCall.args })}\n${TOOL_CALL_CLOSE}`,
      });

      const serializedResult = exec.ok
        ? JSON.stringify(exec.result)
        : JSON.stringify({ error: exec.error });

      messages.push({
        role: 'user',
        content: `Tool result for "${toolCall.name}":\n${serializedResult.slice(0, MAX_TOOL_RESULT)}`,
      });
    }

    // Si agota iteraciones
    await finishTrace(trace, 'error', undefined, { message: 'Max iterations reached', iteration: MAX_ITERATIONS });
    yield {
      type: 'error',
      message: 'El agente alcanzó el límite de pasos sin completar la tarea. Intenta con una pregunta más específica.',
      code: 'MAX_ITERATIONS',
    };
    yield { type: 'done' };
  } catch (err: any) {
    yield {
      type: 'error',
      message: err.message || 'Error durante la ejecución del agente.',
    };
    yield { type: 'done' };
  }
}
