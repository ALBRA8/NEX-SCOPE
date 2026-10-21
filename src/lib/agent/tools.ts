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

  // ─── VIDEO STUDIO & VIDIQ SUITE CAPABILITIES ────────────────────────
  {
    name: 'optimize_title_ctr',
    description: 'Analiza un título de YouTube, calcula su puntuación CTR (0-100), verifica que no supere los 60 caracteres (límite móvil) y genera 5 variantes de alto impacto psicológico.',
    parameters: {
      topic_or_title: {
        type: 'string',
        description: 'Tema o título borrador a optimizar',
        required: true,
      },
    },
    executor: async (args) => {
      const text = String(args.topic_or_title || '').trim();
      if (!text) throw new Error('topic_or_title es requerido');

      const POWER_WORDS = [
        'secreto', 'secretos', 'revelado', 'nuevo', 'fácil', 'rápido', 'paso a paso',
        'definitivo', 'definitiva', 'error', 'errores', 'nunca', 'evita', 'gratis',
        'urgente', 'brutal', 'increíble', 'verdad', 'mentira', 'millonario', 'dinero',
        'éxito', 'mejor', 'peor', 'garantizado', 'sin experiencia', '2026', '24 horas', '30 días'
      ];

      const len = text.length;
      const lower = text.toLowerCase();
      const detectedWords = POWER_WORDS.filter(w => lower.includes(w));

      let score = 30;
      if (len >= 40 && len <= 60) score += 30;
      else if (len > 25 && len <= 70) score += 20;
      else if (len > 0) score += 10;
      score += Math.min(detectedWords.length * 15, 30);
      if (/\d+/.test(text)) score += 10;
      score = Math.min(score, 100);

      const variants = [
        { cat: 'Curiosidad', title: `El Secreto de ${text} que Nadie te Está Contando` },
        { cat: 'Listas/Números', title: `7 Pasos para Dominar ${text} en 2026 (Sin Experiencia)` },
        { cat: 'Alerta/Error', title: `El Mayor Error en ${text} que Arruina tus Resultados` },
        { cat: 'Tutorial', title: `Cómo Hacer ${text} desde Cero (Guía Definitiva y Fácil)` },
        { cat: 'Reto/Viral', title: `Probé ${text} Durante 30 Días (Resultados Reales)` },
      ];

      return {
        originalTitle: text,
        length: len,
        isMobileIdeal: len <= 60 && len >= 35,
        ctrScore: score,
        powerWordsDetected: detectedWords,
        suggestedVariants: variants,
      };
    },
  },
  {
    name: 'generate_high_retention_script',
    description: 'Genera un guión estructurado de alta retención para YouTube: gancho inicial 0-5s, introducción con promesa de valor, 3 bloques de desarrollo con notas visuales y llamada a la acción (CTA).',
    parameters: {
      topic: {
        type: 'string',
        description: 'Tema o título del vídeo',
        required: true,
      },
      audience: {
        type: 'string',
        description: 'Público objetivo (ej: Principiantes, Creadores)',
        required: false,
      },
    },
    executor: async (args) => {
      const topic = String(args.topic || '').trim();
      const audience = String(args.audience || 'Principiantes').trim();
      if (!topic) throw new Error('topic es requerido');

      return {
        topic,
        audience,
        hook_0_to_5s: `¿Sabías que la mayoría comete el mismo error al empezar con ${topic}? En este vídeo vas a descubrir exactamente cómo resolverlo paso a paso.`,
        intro_5_to_25s: `Hola a todos. Hoy vamos a desglosar todo lo que necesitas saber sobre ${topic}, pensado para ${audience}. Quédate hasta el final porque el último punto cambiará por completo tu forma de enfocarlo.`,
        body_sections: [
          {
            block: 1,
            title: `El Fundamento Oculto de ${topic}`,
            points: ['Por qué falla el 90% de la gente', 'El cambio de mentalidad clave'],
            visualRetentionNote: 'Mostrar captura o gráfico en pantalla antes del segundo 45.',
          },
          {
            block: 2,
            title: `Estrategia Práctica en 3 Fases`,
            points: ['Fase 1: Configuración inicial', 'Fase 2: Ejecución', 'Fase 3: Optimización'],
            visualRetentionNote: 'Usar efectos de zoom y texto grande con palabras clave.',
          },
          {
            block: 3,
            title: `El Secreto de los Canales Top`,
            points: ['Consistencia y métricas clave', 'Cómo escalar sin quemarte'],
            visualRetentionNote: 'Bajar la música de fondo para generar intriga y seriedad.',
          },
        ],
        cta_outro: `Si este vídeo te aportó valor, suscríbete para no perderte el próximo análisis. Déjame en los comentarios tu mayor duda sobre ${topic} y te responderé personalmente.`,
      };
    },
  },
  {
    name: 'generate_seo_description',
    description: 'Genera una descripción profesional de YouTube optimizada para SEO con resumen, capítulos/marcas de tiempo (00:00), enlaces y hashtags.',
    parameters: {
      title: {
        type: 'string',
        description: 'Título o tema del vídeo',
        required: true,
      },
    },
    executor: async (args) => {
      const title = String(args.title || '').trim();
      if (!title) throw new Error('title es requerido');

      const desc = `En este vídeo analizamos a fondo todo sobre ${title}. Descubre la guía definitiva con estrategias probadas, consejos prácticos y los errores comunes que debes evitar para maximizar tus resultados en YouTube.

📌 CAPÍTULOS DEL VÍDEO (Marcas de tiempo):
00:00 - Introducción y lo que aprenderás
01:15 - El mayor error que debes evitar
03:40 - Estrategia paso a paso explicada
07:20 - Caso práctico y resultados reales
10:45 - Conclusión y próximos pasos recomendados

🔗 ENLACES DE INTERÉS:
👉 Suscríbete al canal para más contenido semanal: https://youtube.com
👉 Recursos y plantillas gratuitas: https://ejemplo.com/recursos

💬 Cuéntame en los comentarios: ¿Cuál ha sido tu experiencia con ${title}?

#YouTubeTips #${title.replace(/\s+/g, '')} #CrecimientoYouTube #MarketingDigital`;

      return {
        title,
        formattedDescription: desc,
        wordCount: desc.split(/\s+/).filter(Boolean).length,
        hasTimestamps: true,
      };
    },
  },
  {
    name: 'generate_studio_tags',
    description: 'Genera etiquetas optimizadas para YouTube Studio en formato separado por comas, verificando que no supere los 500 caracteres.',
    parameters: {
      keyword: {
        type: 'string',
        description: 'Palabra clave principal',
        required: true,
      },
    },
    executor: async (args) => {
      const keyword = String(args.keyword || '').trim().toLowerCase();
      if (!keyword) throw new Error('keyword es requerido');

      const base = [
        keyword,
        `como hacer ${keyword}`,
        `tutorial ${keyword}`,
        `${keyword} 2026`,
        `${keyword} para principiantes`,
        `trucos ${keyword}`,
        `${keyword} paso a paso`,
        `guia completa ${keyword}`,
        `errores comunes ${keyword}`,
        `mejores estrategias ${keyword}`,
        `${keyword} facil`,
        `aprender ${keyword}`,
      ];

      const formatted = base.join(', ');
      return {
        keyword,
        tagsCount: base.length,
        characterCount: formatted.length,
        withinLimit: formatted.length <= 500,
        formattedStudioTags: formatted,
        individualTags: base,
      };
    },
  },
  {
    name: 'audit_video_seo',
    description: 'Audita un borrador completo de vídeo de YouTube (título, descripción y tags), calcula un Score SEO (0-100) y devuelve un checklist detallado.',
    parameters: {
      title: {
        type: 'string',
        description: 'Título del vídeo',
        required: true,
      },
      description: {
        type: 'string',
        description: 'Descripción del vídeo',
        required: false,
      },
      tags: {
        type: 'string',
        description: 'Etiquetas separadas por comas',
        required: false,
      },
    },
    executor: async (args) => {
      const title = String(args.title || '').trim();
      const desc = String(args.description || '').trim();
      const tags = String(args.tags || '').trim();

      let score = 0;
      const checks = [];

      if (title.length >= 40 && title.length <= 60) {
        score += 30;
        checks.push({ check: 'Longitud del título', status: 'PASS', score: 30, message: `${title.length} caracteres (óptimo para móviles)` });
      } else {
        score += 15;
        checks.push({ check: 'Longitud del título', status: 'WARN', score: 15, message: `${title.length} caracteres (ideal entre 40 y 60)` });
      }

      const descWords = desc.split(/\s+/).filter(Boolean).length;
      if (descWords >= 100) {
        score += 30;
        checks.push({ check: 'Descripción rica en contexto', status: 'PASS', score: 30, message: `${descWords} palabras` });
      } else {
        score += 10;
        checks.push({ check: 'Descripción', status: 'WARN', score: 10, message: `${descWords} palabras (recomendado > 100 palabras)` });
      }

      if (/0\d:\d\d|\d:\d\d/.test(desc)) {
        score += 20;
        checks.push({ check: 'Marcas de tiempo / Capítulos', status: 'PASS', score: 20, message: 'Detectadas marcas de tiempo' });
      } else {
        checks.push({ check: 'Marcas de tiempo', status: 'WARN', score: 0, message: 'No se encontraron marcas de tiempo (00:00)' });
      }

      const tagsCount = tags.split(',').filter(Boolean).length;
      if (tagsCount >= 8 && tagsCount <= 25) {
        score += 20;
        checks.push({ check: 'Etiquetas', status: 'PASS', score: 20, message: `${tagsCount} etiquetas configuradas` });
      } else {
        score += 8;
        checks.push({ check: 'Etiquetas', status: 'WARN', score: 8, message: `${tagsCount} etiquetas (recomendado entre 8 y 20)` });
      }

      return {
        seoScore: Math.min(score, 100),
        checks,
        readyToPublish: score >= 75,
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
