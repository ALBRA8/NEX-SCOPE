/**
 * NexScope MCP (Model Context Protocol) Server Endpoint
 *
 * Exposes NexScope's tools, resources and prompts to external MCP clients
 * (e.g. Claude Desktop, other LLM agents, automation systems) via JSON-RPC 2.0
 * over HTTP. Compatible with the MCP "Streamable HTTP" transport spec.
 *
 * Usage from an MCP client:
 *   POST /api/mcp  with JSON body: { "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {} }
 *
 * All requests require an authenticated session (nexscope_token cookie).
 *
 * Supported methods:
 *   - initialize        — handshake: returns server info + capabilities
 *   - ping               — health check
 *   - tools/list         — list available NexScope tools (12 tools)
 *   - tools/call         — execute a tool by name with args
 *   - resources/list     — list data resources (saved niches, channels, plans, dashboard)
 *   - resources/read     — read a specific resource by URI
 *   - prompts/list       — list predefined prompts
 *   - prompts/get        — get a specific prompt by name
 *
 * Responses are JSON-RPC 2.0: { "jsonrpc": "2.0", "id": <id>, "result": {...} }
 * or on error: { "jsonrpc": "2.0", "id": <id>, "error": { "code": -32xxx, "message": "..." } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';
import { TOOLS, executeTool, type ToolContext } from '@/lib/agent/tools';
import { db } from '@/lib/db';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MCP TYPES (JSON-RPC 2.0)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

function makeResponse(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function makeError(id: string | number | null | undefined, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, data } };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MCP-COMPATIBLE TOOL SCHEMAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convert our internal ToolDef[] to MCP tool list (JSON Schema for parameters).
 */
function mcpToolsList() {
  return TOOLS.map((t) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [name, p] of Object.entries(t.parameters)) {
      const schema: Record<string, unknown> = { type: p.type, description: p.description };
      if (p.enum) schema.enum = p.enum;
      properties[name] = schema;
      if (p.required) required.push(name);
    }
    return {
      name: t.name,
      description: t.description,
      inputSchema: {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
      },
    };
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESOURCES — read-only data exposed to MCP clients
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ResourceDef {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: (ctx: ToolContext) => Promise<unknown>;
}

const RESOURCES: ResourceDef[] = [
  {
    uri: 'nexscope://dashboard',
    name: 'Dashboard del usuario',
    description: 'Estadísticas resumidas: número de nichos, canales, mensajes y planes guardados.',
    mimeType: 'application/json',
    read: async (ctx) => {
      const [niches, channels, messages, plans] = await Promise.all([
        db.savedNiche.count({ where: { userId: ctx.userId } }),
        db.savedChannel.count({ where: { userId: ctx.userId } }),
        db.chatMessage.count({ where: { userId: ctx.userId } }),
        db.contentPlan.count({ where: { userId: ctx.userId } }),
      ]);
      return { niches, channels, messages, plans };
    },
  },
  {
    uri: 'nexscope://niches',
    name: 'Nichos guardados',
    description: 'Lista de nichos guardados por el usuario (hasta 50, más recientes primero).',
    mimeType: 'application/json',
    read: async (ctx) => {
      return await db.savedNiche.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },
  },
  {
    uri: 'nexscope://channels',
    name: 'Canales guardados',
    description: 'Lista de canales de YouTube guardados por el usuario (hasta 50, más recientes primero).',
    mimeType: 'application/json',
    read: async (ctx) => {
      return await db.savedChannel.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },
  },
  {
    uri: 'nexscope://plans',
    name: 'Planes de contenido guardados',
    description: 'Lista de planes de contenido guardados por el usuario (hasta 20, más recientes primero).',
    mimeType: 'application/json',
    read: async (ctx) => {
      return await db.contentPlan.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, niche: true, audience: true, createdAt: true, updatedAt: true },
      });
    },
  },
  {
    uri: 'nexscope://user',
    name: 'Perfil del usuario',
    description: 'Información del usuario autenticado (sin contraseña).',
    mimeType: 'application/json',
    read: async (ctx) => ({
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
    }),
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREDEFINED PROMPTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PromptDef {
  name: string;
  description: string;
  arguments: { name: string; description: string; required?: boolean }[];
  template: (args: Record<string, string>) => string;
}

const PROMPTS: PromptDef[] = [
  {
    name: 'analyze_niche',
    description: 'Análisis completo de un nicho: keywords, tendencias, brechas de contenido y plan inicial.',
    arguments: [
      { name: 'niche', description: 'Nicho a analizar (ej. "IA generativa")', required: true },
    ],
    template: (a) =>
      `Actúa como un consultor de contenido de YouTube. Analiza el nicho "${a.niche || 'sin especificar'}" ` +
      `usando las herramientas disponibles. Genera:
1. 15 keywords relevantes (generate_keywords)
2. Tendencias actuales del nicho (get_trends)
3. 8 brechas de contenido (find_content_gaps)
4. Un plan de contenido de 30 videos para una audiencia de 25-40 años (generate_content_plan)

Resume los hallazgos en un informe claro con oportunidades destacadas.`,
  },
  {
    name: 'monetization_report',
    description: 'Calcula y reporta la monetización potencial de un canal.',
    arguments: [
      { name: 'niche', description: 'Nicho del canal', required: true },
      { name: 'subscribers', description: 'Número de suscriptores', required: true },
      { name: 'viewsPerMonth', description: 'Vistas mensuales estimadas', required: true },
    ],
    template: (a) =>
      `Usa la herramienta calculate_monetization con niche="${a.niche || ''}", subscribers=${a.subscribers || 0}, ` +
      `viewsPerMonth=${a.viewsPerMonth || 0}. Explica los resultados y recomienda 3 estrategias para aumentar ingresos.`,
  },
  {
    name: 'channel_audit',
    description: 'Auditoría de un canal de YouTube guardado: estadísticas + recomendaciones.',
    arguments: [
      { name: 'channelId', description: 'ID del canal de YouTube (UC...)', required: true },
    ],
    template: (a) =>
      `Usa get_channel_stats con channelId="${a.channelId || ''}" para obtener estadísticas. ` +
      `Luego lista 5 recomendaciones accionables basadas en los datos (suscriptores, vistas, videos, descripción).`,
  },
  {
    name: 'dashboard_summary',
    description: 'Resumen del estado del usuario: dashboard + nichos guardados + próximos pasos.',
    arguments: [],
    template: () =>
      `Usa get_dashboard_stats y list_saved_niches para mostrar un resumen del estado actual del usuario. ` +
      `Termina con 3 recomendaciones de próximos pasos basados en lo que tenga guardado.`,
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METHOD DISPATCHER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMethod(req: JsonRpcRequest, ctx: ToolContext): Promise<JsonRpcResponse> {
  const id = req.id ?? null;
  const p = req.params || {};

  switch (req.method) {
    case 'initialize':
      return makeResponse(id, {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'nexscope',
          version: '1.0.0',
          description: 'NexScope MCP Server — AI-powered YouTube niche finder SaaS',
        },
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          prompts: { listChanged: false },
        },
      });

    case 'ping':
      return makeResponse(id, { status: 'ok' });

    case 'tools/list':
      return makeResponse(id, { tools: mcpToolsList() });

    case 'tools/call': {
      const name = String(p.name || '').trim();
      const args = (p.arguments && typeof p.arguments === 'object' ? p.arguments : {}) as Record<string, unknown>;
      if (!name) return makeError(id, INVALID_PARAMS, 'name es requerido');
      const exec = await executeTool(name, args, ctx);
      if (exec.ok) {
        return makeResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(exec.result, null, 2),
              mimeType: 'application/json',
            },
          ],
          isError: false,
        });
      }
      return makeResponse(id, {
        content: [{ type: 'text', text: exec.error }],
        isError: true,
      });
    }

    case 'resources/list':
      return makeResponse(id, {
        resources: RESOURCES.map((r) => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        })),
      });

    case 'resources/read': {
      const uri = String(p.uri || '').trim();
      if (!uri) return makeError(id, INVALID_PARAMS, 'uri es requerido');
      const resource = RESOURCES.find((r) => r.uri === uri);
      if (!resource) return makeError(id, INVALID_PARAMS, `Recurso no encontrado: ${uri}`);
      try {
        const data = await resource.read(ctx);
        return makeResponse(id, {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType,
              text: JSON.stringify(data, null, 2),
            },
          ],
        });
      } catch (err: any) {
        return makeError(id, INTERNAL_ERROR, 'Error leyendo recurso', { detail: err?.message });
      }
    }

    case 'prompts/list':
      return makeResponse(id, {
        prompts: PROMPTS.map((p) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
        })),
      });

    case 'prompts/get': {
      const name = String(p.name || '').trim();
      if (!name) return makeError(id, INVALID_PARAMS, 'name es requerido');
      const prompt = PROMPTS.find((p) => p.name === name);
      if (!prompt) return makeError(id, INVALID_PARAMS, `Prompt no encontrado: ${name}`);
      const args = (p.arguments && typeof p.arguments === 'object' ? p.arguments : {}) as Record<string, string>;
      return makeResponse(id, {
        description: prompt.description,
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: prompt.template(args) },
          },
        ],
      });
    }

    default:
      return makeError(id, METHOD_NOT_FOUND, `Método no soportado: ${req.method}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HTTP HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(req: NextRequest) {
  // Auth gate — MCP server requires authenticated session
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'No autenticado' } },
      { status: 401 }
    );
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = (await req.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: PARSE_ERROR, message: 'JSON inválido' } },
      { status: 400 }
    );
  }

  const ctx: ToolContext = { userId: user.id, user: { id: user.id, name: user.name, email: user.email } };

  // Batch request support
  if (Array.isArray(body)) {
    const responses: JsonRpcResponse[] = [];
    for (const item of body) {
      if (!item || item.jsonrpc !== '2.0' || typeof item.method !== 'string') {
        responses.push(makeError(item?.id, INVALID_REQUEST, 'Petición JSON-RPC inválida'));
        continue;
      }
      try {
        responses.push(await handleMethod(item, ctx));
      } catch (err: any) {
        logError('MCP handler', err);
        responses.push(makeError(item.id, INTERNAL_ERROR, 'Error interno del servidor'));
      }
    }
    return NextResponse.json(responses);
  }

  // Single request
  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return NextResponse.json(
      makeError(body?.id, INVALID_REQUEST, 'Petición JSON-RPC inválida'),
      { status: 400 }
    );
  }

  try {
    const response = await handleMethod(body, ctx);
    return NextResponse.json(response);
  } catch (err: any) {
    logError('MCP handler', err);
    return NextResponse.json(
      makeError(body.id, INTERNAL_ERROR, 'Error interno del servidor'),
      { status: 500 }
    );
  }
}

// GET handler — for clients that want to probe the endpoint
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const authed = !!user;
  return NextResponse.json({
    server: 'nexscope-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    authenticated: authed,
    user: authed ? { id: user!.id, email: user!.email } : null,
    methods: [
      'initialize',
      'ping',
      'tools/list',
      'tools/call',
      'resources/list',
      'resources/read',
      'prompts/list',
      'prompts/get',
    ],
    toolCount: TOOLS.length,
    resourceCount: RESOURCES.length,
    promptCount: PROMPTS.length,
    docs: 'POST JSON-RPC 2.0 requests. Auth required (nexscope_token cookie).',
  });
}
