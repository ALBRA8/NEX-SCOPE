/**
 * NexScope Agent — Tool registry
 *
 * Each tool exposes a name + description (for the LLM), a parameter schema,
 * and an executor function that performs the actual operation.
 *
 * The agent's executor (see ./executor.ts) calls these as the LLM decides.
 */

import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { safeErrorMessage } from '@/lib/errors';
import { aiProvenance, wrapWithProvenance } from '@/lib/provenance';
import { recordMemory, recallMemories } from '@/lib/memory';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ToolContext {
  userId: string;
  user: { id: string; name: string | null; email: string };
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean';
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  /** Returns a JSON-serializable result. Throw on failure. */
  executor: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARED HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Call Z.ai with a system prompt + user message, parse JSON from response.
 * Used by all AI tools to keep prompts DRY-ish (each AI endpoint in /api/*
 * has its own copy; this is the agent's version).
 */
async function callAI<T = unknown>(systemPrompt: string, userMessage: string): Promise<T | null> {
  const zai = await ZAI.create();
  const response = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });
  const content = response.choices?.[0]?.message?.content || '';
  return extractJson<T>(content);
}

/** Read user's YouTube API key from Setting table or env. */
async function getYouTubeApiKey(): Promise<string | null> {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'YOUTUBE_API_KEY' } });
    if (setting?.value) return setting.value;
  } catch {
    // ignore DB errors
  }
  return process.env.YOUTUBE_API_KEY || null;
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TOOLS: ToolDef[] = [
  // ─── READ SYSTEM STATE ───────────────────────────────────────────
  {
    name: 'get_dashboard_stats',
    description:
      'Obtiene un resumen del estado actual del usuario en NexScope: número de nichos guardados, canales guardados, mensajes de chat y planes de contenido. Úsalo cuando el usuario pregunte "qué tengo guardado" o "cuántos nichos tengo".',
    parameters: {},
    executor: async (_args, ctx) => {
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
    name: 'list_saved_niches',
    description:
      'Lista los nichos guardados por el usuario (con su categoría, score y fecha). Úsalo antes de recomendar o eliminar nichos, o cuando el usuario quiera ver qué ha guardado.',
    parameters: {},
    executor: async (_args, ctx) => {
      const niches = await db.savedNiche.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return { count: niches.length, niches };
    },
  },

  {
    name: 'list_saved_channels',
    description:
      'Lista los canales de YouTube guardados por el usuario (con suscriptores, vistas, etc.). Úsalo para análisis comparativo o cuando el usuario quiera ver sus canales.',
    parameters: {},
    executor: async (_args, ctx) => {
      const channels = await db.savedChannel.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return { count: channels.length, channels };
    },
  },

  {
    name: 'list_saved_plans',
    description:
      'Lista los planes de contenido guardados por el usuario. Úsalo cuando el usuario quiera revisar planes anteriores o continuar trabajando en uno.',
    parameters: {},
    executor: async (_args, ctx) => {
      const plans = await db.contentPlan.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, niche: true, audience: true, createdAt: true },
      });
      return { count: plans.length, plans };
    },
  },

  // ─── WRITE TO SYSTEM (save items) ───────────────────────────────
  {
    name: 'save_niche',
    description:
      'Guarda un nicho en la lista del usuario. Úsalo cuando el usuario diga "guárdate este nicho" o "añádelo a mi lista". Requiere nicheId (cualquier ID único, ej. "niche-ia-mascotas"), nicheName (nombre legible) y opcionalmente category.',
    parameters: {
      nicheId: { type: 'string', description: 'ID único del nicho (ej. "niche-ia-mascotas")', required: true },
      nicheName: { type: 'string', description: 'Nombre legible del nicho', required: true },
      category: {
        type: 'string',
        description: 'Categoría del nicho',
        enum: ['Tecnología', 'Finanzas', 'Salud', 'Entretenimiento', 'Educación', 'Gaming', 'Cocina', 'Viajes', 'Moda', 'Productividad', 'Arte', 'Música', 'Otros'],
      },
      nicheScore: { type: 'number', description: 'Score del nicho (0-100)' },
    },
    executor: async (args, ctx) => {
      const nicheId = String(args.nicheId || '').trim();
      const nicheName = String(args.nicheName || '').trim();
      if (!nicheId || !nicheName) throw new Error('nicheId y nicheName son requeridos');
      const existing = await db.savedNiche.findFirst({ where: { userId: ctx.userId, nicheId } });
      if (existing) return { saved: false, reason: 'already_exists', niche: existing };
      const niche = await db.savedNiche.create({
        data: {
          userId: ctx.userId,
          nicheId: nicheId.slice(0, 200),
          nicheName: nicheName.slice(0, 200),
          category: String(args.category || 'Otros').slice(0, 100),
          nicheScore: Number(args.nicheScore) || 0,
        },
      });
      return { saved: true, niche };
    },
  },

  {
    name: 'save_channel',
    description:
      'Guarda un canal de YouTube en la lista del usuario. Requiere channelId (UC... de YouTube) y channelName.',
    parameters: {
      channelId: { type: 'string', description: 'ID del canal de YouTube (empieza con UC...)', required: true },
      channelName: { type: 'string', description: 'Nombre legible del canal', required: true },
      niche: { type: 'string', description: 'Nicho del canal' },
      subscribers: { type: 'number', description: 'Número de suscriptores' },
    },
    executor: async (args, ctx) => {
      const channelId = String(args.channelId || '').trim();
      const channelName = String(args.channelName || '').trim();
      if (!channelId || !channelName) throw new Error('channelId y channelName son requeridos');
      const existing = await db.savedChannel.findFirst({ where: { userId: ctx.userId, channelId } });
      if (existing) return { saved: false, reason: 'already_exists', channel: existing };
      const channel = await db.savedChannel.create({
        data: {
          userId: ctx.userId,
          channelId: channelId.slice(0, 200),
          channelName: channelName.slice(0, 200),
          subscribers: Number(args.subscribers) || 0,
        },
      });
      return { saved: true, channel };
    },
  },

  {
    name: 'delete_saved_niche',
    description:
      'Elimina un nicho de la lista guardada del usuario. Requiere nicheId (el ID interno del nicho).',
    parameters: {
      nicheId: { type: 'string', description: 'ID del nicho a eliminar', required: true },
    },
    executor: async (args, ctx) => {
      const nicheId = String(args.nicheId || '').trim();
      const existing = await db.savedNiche.findFirst({ where: { userId: ctx.userId, nicheId } });
      if (!existing) return { deleted: false, reason: 'not_found' };
      await db.savedNiche.delete({ where: { id: existing.id } });
      return { deleted: true };
    },
  },

  // ─── AI TOOLS (call Z.ai) ───────────────────────────────────────
  {
    name: 'generate_keywords',
    description:
      'Genera 15 keywords para un nicho usando IA. Devuelve keyword, volumen de búsqueda estimado, competencia, CPC, tendencia mensual y keywords relacionadas. Úsalo cuando el usuario quiera optimizar SEO.',
    parameters: {
      niche: { type: 'string', description: 'Nicho para el cual generar keywords', required: true },
    },
    executor: async (args) => {
      const niche = String(args.niche || '').trim();
      if (!niche) throw new Error('niche es requerido');
      const parsed = await callAI<{ keywords: unknown[] }>(
        `Eres un experto en SEO y marketing de contenido de YouTube. Devuelves UNICAMENTE un JSON válido con este formato exacto:
{
  "keywords": [
    { "keyword": "string", "volume": number, "competition": number_0_100, "cpc": number_usd, "trend": [number_x12], "relatedKeywords": ["string","string","string","string"] }
  ]
}
Genera exactamente 15 keywords relevantes para el nicho.

IMPORTANTE: Los valores de volume, competition, cpc y trend son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de Google/YouTube. Genéralos como hipótesis razonables basadas en tu conocimiento del nicho, pero recuerda que son estimaciones, no hechos verificables.`,
        `Genera keywords para el nicho: ${niche}`
      );
      if (!parsed || !Array.isArray(parsed.keywords) || parsed.keywords.length === 0) {
        throw new Error('La IA no devolvió keywords válidos');
      }
      return wrapWithProvenance(
        { count: parsed.keywords.length, keywords: parsed.keywords },
        aiProvenance()
      );
    },
  },

  {
    name: 'get_trends',
    description:
      'Genera tendencias de YouTube actuales usando IA. Devuelve nombre, categoría, growthRate, nicheScore, monthlySearchVolume, estimatedRPM, competitionLevel y descripción. Opcionalmente filtrable por nicho.',
    parameters: {
      niche: { type: 'string', description: 'Nicho específico para filtrar tendencias (opcional)' },
    },
    executor: async (args) => {
      const niche = args.niche ? String(args.niche).trim() : '';
      const parsed = await callAI<{ trends: unknown[] }>(
        `Eres un analista de tendencias de YouTube. Devuelves UNICAMENTE un JSON válido con este formato exacto:
{
  "trends": [
    { "name": "string", "category": "string", "growthRate": number, "trendVelocity": number, "nicheScore": number_0_100, "monthlySearchVolume": number, "estimatedRPM": number, "competitionLevel": "bajo|medio|alto", "description": "string" }
  ]
}
Genera 10 tendencias principales.

IMPORTANTE: Los valores de growthRate, trendVelocity, nicheScore, monthlySearchVolume y estimatedRPM son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de YouTube Trends. Genéralos como hipótesis razonables, pero recuerda que son estimaciones, no hechos verificables.`,
        niche
          ? `Genera tendencias de YouTube para el área: ${niche}`
          : 'Genera las principales tendencias de YouTube en español ahora'
      );
      if (!parsed || !Array.isArray(parsed.trends) || parsed.trends.length === 0) {
        throw new Error('La IA no devolvió tendencias válidas');
      }
      return wrapWithProvenance(
        { count: parsed.trends.length, trends: parsed.trends },
        aiProvenance()
      );
    },
  },

  {
    name: 'find_content_gaps',
    description:
      'Encuentra 8 brechas de contenido para un nicho usando IA. Devuelve topic, searchVolume, existingVideos, opportunityScore y suggestedTitle. Úsalo para encontrar oportunidades de contenido poco explotado.',
    parameters: {
      niche: { type: 'string', description: 'Nicho a analizar', required: true },
    },
    executor: async (args) => {
      const niche = String(args.niche || '').trim();
      if (!niche) throw new Error('niche es requerido');
      const parsed = await callAI<{ gaps: unknown[] }>(
        `Eres un analista experto en contenido de YouTube. Devuelves UNICAMENTE un JSON válido con este formato exacto:
{
  "gaps": [
    { "topic": "string", "searchVolume": number, "existingVideos": number, "opportunityScore": number_1_100, "suggestedTitle": "string" }
  ]
}
Devuelve exactamente 8 brechas de contenido.

IMPORTANTE: Los valores de searchVolume y existingVideos son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de YouTube. Genéralos como hipótesis razonables basadas en tu conocimiento del nicho, pero recuerda que son estimaciones, no hechos verificables.`,
        `Analiza las brechas de contenido para el nicho: ${niche}`
      );
      if (!parsed || !Array.isArray(parsed.gaps) || parsed.gaps.length === 0) {
        throw new Error('La IA no devolvió brechas válidas');
      }
      return wrapWithProvenance(
        { count: parsed.gaps.length, gaps: parsed.gaps },
        aiProvenance()
      );
    },
  },

  {
    name: 'generate_content_plan',
    description:
      'Genera un plan de contenido de 30 videos para un nicho y audiencia usando IA. Devuelve title, description, keywords, estimatedViews, difficulty, format y week. Úsalo para planificar 10 semanas de contenido.',
    parameters: {
      niche: { type: 'string', description: 'Nicho del canal', required: true },
      audience: { type: 'string', description: 'Audiencia objetivo (ej. "jóvenes 18-35 años")', required: true },
    },
    executor: async (args) => {
      const niche = String(args.niche || '').trim();
      const audience = String(args.audience || '').trim();
      if (!niche || !audience) throw new Error('niche y audience son requeridos');
      const parsed = await callAI<{ plan: unknown[] }>(
        `Eres un planificador de contenido experto en YouTube. Devuelves UNICAMENTE un JSON válido con este formato exacto:
{
  "plan": [
    { "title": "string", "description": "string", "keywords": ["string","string","string"], "estimatedViews": number, "difficulty": "fácil|medio|difícil", "format": "Tutorial|Review|Análisis|Lista|Vlog|Q&A|Live|Entrevista|Serie|Noticias|Opinión", "week": number_1_10 }
  ]
}
Genera exactamente 30 ideas de video.

IMPORTANTE: Los valores de estimatedViews y difficulty son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de YouTube. Genéralos como hipótesis razonables basadas en tu conocimiento del nicho y audiencia, pero recuerda que son estimaciones, no hechos verificables.`,
        `Genera un plan de contenido de 30 videos para el nicho "${niche}" con audiencia "${audience}"`
      );
      if (!parsed || !Array.isArray(parsed.plan) || parsed.plan.length === 0) {
        throw new Error('La IA no devolvió un plan válido');
      }
      return wrapWithProvenance(
        { count: parsed.plan.length, plan: parsed.plan },
        aiProvenance()
      );
    },
  },

  {
    name: 'calculate_monetization',
    description:
      'Calcula la monetización estimada de un canal usando IA. Devuelve rpm, cpm, monthlyRevenue, annualRevenue y rpmByNiche. Úsalo cuando el usuario quiera proyectar ingresos.',
    parameters: {
      niche: { type: 'string', description: 'Nicho del canal', required: true },
      subscribers: { type: 'number', description: 'Número de suscriptores', required: true },
      viewsPerMonth: { type: 'number', description: 'Vistas mensuales estimadas', required: true },
    },
    executor: async (args) => {
      const niche = String(args.niche || '').trim();
      const subscribers = Number(args.subscribers);
      const viewsPerMonth = Number(args.viewsPerMonth);
      if (!niche || !Number.isFinite(subscribers) || !Number.isFinite(viewsPerMonth)) {
        throw new Error('niche, subscribers y viewsPerMonth son requeridos y deben ser válidos');
      }
      const parsed = await callAI<{ rpm: number; monthlyRevenue: number }>(
        `Eres un analista financiero de YouTube. Devuelves UNICAMENTE un JSON válido con este formato exacto:
{
  "rpm": number,
  "cpm": number,
  "monthlyRevenue": number,
  "annualRevenue": number,
  "rpmByNiche": [{"niche": "string", "rpm": number}]
}

IMPORTANTE: Todos los valores numéricos son ESTIMACIONES generadas por ti (modelo de lenguaje), NO datos oficiales de YouTube Ads. Genéralos como hipótesis razonables basadas en rangos típico del nicho, pero recuerda que son estimaciones, no hechos verificables.`,
        `Calcula la monetización para el nicho "${niche}" con ${subscribers} suscriptores y ${viewsPerMonth} vistas/mes.`
      );
      if (!parsed || !parsed.rpm || !parsed.monthlyRevenue) {
        throw new Error('La IA no devolvió una estimación válida');
      }
      return wrapWithProvenance(parsed, aiProvenance());
    },
  },

  // ─── YOUTUBE DATA API TOOLS ─────────────────────────────────────
  {
    name: 'search_youtube',
    description:
      'Busca videos, canales o playlists en YouTube usando la YouTube Data API v3. Requiere query y type (video|channel|playlist). El usuario debe tener configurada su YouTube API key en Ajustes.',
    parameters: {
      query: { type: 'string', description: 'Término de búsqueda', required: true },
      type: {
        type: 'string',
        description: 'Tipo de resultado',
        enum: ['video', 'channel', 'playlist'],
        required: true,
      },
      maxResults: { type: 'number', description: 'Máximo de resultados (default 10, máx 50)' },
    },
    executor: async (args) => {
      const query = String(args.query || '').trim();
      const type = String(args.type || 'video').trim();
      if (!query) throw new Error('query es requerido');
      const maxResults = Math.min(Number(args.maxResults) || 10, 50);
      const apiKey = await getYouTubeApiKey();
      if (!apiKey) {
        return {
          error: 'YouTube API key no configurada',
          hint: 'Pide al usuario que configure su YouTube API key en la vista Ajustes.',
        };
      }
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type,
        maxResults: String(maxResults),
        relevanceLanguage: 'es',
        key: apiKey,
      });
      const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
      const data = await response.json();
      if (data.error) throw new Error(`YouTube API: ${data.error.message}`);
      return {
        count: data.items?.length || 0,
        items: (data.items || []).map((item: any) => ({
          kind: item.id?.kind,
          videoId: item.id?.videoId,
          channelId: item.id?.channelId,
          title: item.snippet?.title,
          description: item.snippet?.description?.slice(0, 200),
          channelTitle: item.snippet?.channelTitle,
          publishedAt: item.snippet?.publishedAt,
          thumbnail: item.snippet?.thumbnails?.medium?.url,
        })),
      };
    },
  },

  {
    name: 'get_channel_stats',
    description:
      'Obtiene estadísticas detalladas de un canal de YouTube (suscriptores, vistas, videos, descripción, avatar) usando la YouTube Data API v3.',
    parameters: {
      channelId: { type: 'string', description: 'ID del canal (empieza con UC...)', required: true },
    },
    executor: async (args) => {
      const channelId = String(args.channelId || '').trim();
      if (!channelId) throw new Error('channelId es requerido');
      const apiKey = await getYouTubeApiKey();
      if (!apiKey) {
        return {
          error: 'YouTube API key no configurada',
          hint: 'Pide al usuario que configure su YouTube API key en la vista Ajustes.',
        };
      }
      const params = new URLSearchParams({
        part: 'snippet,statistics,brandingSettings',
        id: channelId,
        key: apiKey,
      });
      const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);
      const data = await response.json();
      if (data.error) throw new Error(`YouTube API: ${data.error.message}`);
      if (!data.items?.length) return { error: 'Canal no encontrado' };
      const ch = data.items[0];
      return {
        id: ch.id,
        title: ch.snippet?.title,
        description: ch.snippet?.description?.slice(0, 500),
        publishedAt: ch.snippet?.publishedAt,
        country: ch.snippet?.country,
        thumbnail: ch.snippet?.thumbnails?.medium?.url,
        subscribers: Number(ch.statistics?.subscriberCount || 0),
        totalViews: Number(ch.statistics?.viewCount || 0),
        videoCount: Number(ch.statistics?.videoCount || 0),
        keywords: ch.brandingSettings?.channel?.keywords,
      };
    },
  },

  // ─── MEMORY TOOLS (agent's own long-term memory) ───────────────
  {
    name: 'recall_memory',
    description:
      'Recupera memorias previamente guardadas por el agente para el usuario actual (observaciones, hechos, planes previos, etc.). Úsalo ANTES de generar una recomendación para evitar duplicar trabajo y para personalizar la respuesta con el contexto histórico del usuario. Devuelve { count, memories[] } ordenadas por relevancia.',
    parameters: {
      query: {
        type: 'string',
        description: 'Texto de búsqueda (palabras clave). Coincidencia parcial en el contenido.',
      },
      type: {
        type: 'string',
        description: 'Filtrar por tipo de memoria',
        enum: ['EPISODIC', 'SEMANTIC', 'FACTUAL', 'PROCEDURAL'],
      },
      limit: {
        type: 'number',
        description: 'Máximo número de memorias a devolver (default 10, máx 50)',
      },
    },
    executor: async (args, ctx) => {
      const memories = await recallMemories(ctx.userId, {
        q: typeof args.query === 'string' ? args.query : undefined,
        type: typeof args.type === 'string' ? args.type : undefined,
        limit: Math.min(Number(args.limit) || 10, 50),
      });
      // Trim content for the LLM context window — full content is in the DB.
      const trimmed = memories.map((m) => ({
        id: m.id,
        domain: m.domain,
        type: m.type,
        content: m.content.slice(0, 500),
        source: m.source,
        confidence: m.confidence,
        truthLevel: m.truthLevel,
        relevance: m.relevance,
        createdAt: m.createdAt,
      }));
      return { count: trimmed.length, memories: trimmed };
    },
  },

  {
    name: 'record_memory',
    description:
      'Guarda una memoria en la base de conocimiento del usuario para uso futuro del agente. Úsalo cuando observes un hecho estable (ej. "el canal X tiene 50k suscriptores"), una preferencia del usuario (ej. "prefiere nichos de tecnología"), o un plan acordado (ej. "publicará 2 videos/semana sobre IA"). NO lo uses para datos volátiles ni como repositorio de chat. Devuelve { recorded: true, memory }.',
    parameters: {
      content: {
        type: 'string',
        description: 'Contenido de la memoria (hecho, preferencia o procedimiento). Sé específico.',
        required: true,
      },
      type: {
        type: 'string',
        description: 'Tipo de memoria',
        enum: ['EPISODIC', 'SEMANTIC', 'FACTUAL', 'PROCEDURAL'],
        required: true,
      },
      source: {
        type: 'string',
        description: 'Origen de la memoria (ej. "get_channel_stats", "user_input"). Default: "agent:recall".',
      },
      confidence: {
        type: 'number',
        description: 'Confianza 0..1 (default 0.5). Sube a 0.9 solo si el dato está verificado por fuente externa.',
      },
    },
    executor: async (args, ctx) => {
      const content = String(args.content || '').trim();
      const type = String(args.type || '').trim();
      if (!content) throw new Error('content es requerido');
      if (!type) throw new Error('type es requerido (EPISODIC|SEMANTIC|FACTUAL|PROCEDURAL)');

      const memory = await recordMemory(ctx.userId, {
        domain: 'youtube_intelligence',
        type,
        content,
        source: typeof args.source === 'string' && args.source.trim()
          ? args.source.trim()
          : 'agent:recall',
        provenance: 'AI_MODEL',
        confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
        truthLevel: 'ESTIMATED',
      });
      return {
        recorded: true,
        memory: {
          id: memory.id,
          type: memory.type,
          content: memory.content.slice(0, 500),
          source: memory.source,
          confidence: memory.confidence,
        },
      };
    },
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOOKUP + EXECUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TOOL_MAP: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{ ok: true; result: unknown } | { ok: false; error: string }> {
  const tool = TOOL_MAP[name];
  if (!tool) {
    return { ok: false, error: `Herramienta desconocida: ${name}` };
  }
  try {
    const result = await tool.executor(args, ctx);
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: safeErrorMessage(err, 'Error ejecutando herramienta') };
  }
}

/**
 * Build a compact text summary of all tools for the LLM's system prompt.
 */
export function toolsForPrompt(): string {
  return TOOLS.map((t) => {
    const params = Object.entries(t.parameters)
      .map(([name, p]) => `${name}: ${p.type}${p.required ? ' (requerido)' : ''}`)
      .join(', ');
    return `- ${t.name}(${params}) — ${t.description}`;
  }).join('\n');
}
