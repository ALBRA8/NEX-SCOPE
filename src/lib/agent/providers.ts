/**
 * NexScope Agent — Universal LLM Provider Engine
 * Paridad con ALBRA AGENT SEED V1.0 (AGENTE-GENERAL)
 *
 * Soporta múltiples proveedores con detección automática y fallback:
 * 1. Groq (Ultra-rápido, Llama 3.3 / GPT-OSS)
 * 2. NVIDIA NIM (z-ai/glm-5.3-flash, Llama 3.1 70B)
 * 3. OpenAI (GPT-4o, GPT-4o-mini)
 * 4. Z.ai Web Dev SDK (Fallback en nube)
 */

import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export interface ProviderConfig {
  provider: 'groq' | 'nvidia' | 'openai' | 'zai' | 'mock';
  base_url: string;
  model: string;
  api_key: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  timeout: number;
}

const SETTINGS_FILE = path.join(process.cwd(), '.provider-settings.json');

const DEFAULT_CONFIG: ProviderConfig = {
  provider: 'groq',
  base_url: 'https://api.groq.com/openai/v1',
  model: 'llama-3.3-70b-versatile',
  api_key: '',
  temperature: 0.5,
  top_p: 1.0,
  max_tokens: 2048,
  timeout: 60,
};

export async function getActiveProviderConfig(): Promise<ProviderConfig> {
  // 1. Intentar leer de archivo .provider-settings.json
  try {
    const data = await readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed.api_key) return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    // Si no existe, revisar base de datos y entorno
  }

  // 2. Intentar leer de tabla Setting (DB)
  try {
    const dbGroq = await db.setting.findUnique({ where: { key: 'GROQ_API_KEY' } });
    if (dbGroq?.value) {
      return {
        ...DEFAULT_CONFIG,
        provider: 'groq',
        base_url: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        api_key: dbGroq.value,
      };
    }

    const dbNvidia = await db.setting.findUnique({ where: { key: 'NVIDIA_API_KEY' } });
    if (dbNvidia?.value) {
      return {
        ...DEFAULT_CONFIG,
        provider: 'nvidia',
        base_url: 'https://integrate.api.nvidia.com/v1',
        model: 'z-ai/glm-5.3-flash',
        api_key: dbNvidia.value,
      };
    }

    const dbOpenAI = await db.setting.findUnique({ where: { key: 'OPENAI_API_KEY' } });
    if (dbOpenAI?.value) {
      return {
        ...DEFAULT_CONFIG,
        provider: 'openai',
        base_url: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        api_key: dbOpenAI.value,
      };
    }
  } catch {
    // ignorar fallo de DB
  }

  // 3. Revisar variables de entorno del servidor
  if (process.env.GROQ_API_KEY) {
    return {
      ...DEFAULT_CONFIG,
      provider: 'groq',
      base_url: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile',
      api_key: process.env.GROQ_API_KEY,
    };
  }

  if (process.env.NVIDIA_API_KEY) {
    return {
      ...DEFAULT_CONFIG,
      provider: 'nvidia',
      base_url: 'https://integrate.api.nvidia.com/v1',
      model: 'z-ai/glm-5.3-flash',
      api_key: process.env.NVIDIA_API_KEY,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      ...DEFAULT_CONFIG,
      provider: 'openai',
      base_url: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      api_key: process.env.OPENAI_API_KEY,
    };
  }

  // Fallback a ZAI si no hay claves externas
  return {
    ...DEFAULT_CONFIG,
    provider: 'zai',
    base_url: '',
    model: 'default',
    api_key: '',
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Invoca el LLM activo según la configuración universal de AGENTE-GENERAL.
 */
export async function callLLM(messages: ChatMessage[], options?: Partial<ProviderConfig>): Promise<string> {
  const config = { ...(await getActiveProviderConfig()), ...options };

  // Caso 1: Proveedores compatibles con OpenAI (Groq, NVIDIA NIM, OpenAI)
  if (config.provider === 'groq' || config.provider === 'nvidia' || config.provider === 'openai') {
    if (!config.api_key) {
      throw new Error(`API Key no configurada para el proveedor ${config.provider}`);
    }

    const endpoint = `${config.base_url.replace(/\/+$/, '')}/chat/completions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        top_p: config.top_p,
        max_tokens: config.max_tokens,
      }),
      signal: AbortSignal.timeout((config.timeout || 60) * 1000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Error ${res.status} de ${config.provider}: ${errText.slice(0, 200)}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
  }

  // Caso 2: Fallback a ZAI
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });
    return response.choices?.[0]?.message?.content || '';
  } catch (err: any) {
    throw new Error(`Fallo en llamada a LLM: ${err.message || 'Error desconocido'}`);
  }
}
