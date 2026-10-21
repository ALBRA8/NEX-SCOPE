import { NextResponse } from 'next/server';
import { getActiveProviderConfig } from '@/lib/agent/providers';
import { writeFile } from 'fs/promises';
import { db } from '@/lib/db';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), '.provider-settings.json');

export async function GET() {
  const config = await getActiveProviderConfig();
  // No exponer la API key completa por seguridad en GET
  return NextResponse.json({
    ...config,
    has_key: Boolean(config.api_key),
    api_key_masked: config.api_key ? `${config.api_key.slice(0, 4)}...${config.api_key.slice(-4)}` : '',
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const provider = body.provider || 'groq';
    const baseUrl = body.base_url || (provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://integrate.api.nvidia.com/v1');
    const model = body.model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'z-ai/glm-5.3-flash');
    const apiKey = body.api_key || '';
    const temperature = Number(body.temperature) || 0.5;
    const topP = Number(body.top_p) || 1.0;
    const maxTokens = Number(body.max_tokens) || 2048;
    const timeout = Number(body.timeout) || 60;

    const toSave = {
      provider,
      base_url: baseUrl,
      model,
      api_key: apiKey,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      timeout,
    };

    await writeFile(SETTINGS_FILE, JSON.stringify(toSave, null, 2), 'utf-8');

    // También guardar en DB Setting si es una clave reconocida
    if (apiKey) {
      const dbKey = provider === 'groq' ? 'GROQ_API_KEY' : provider === 'nvidia' ? 'NVIDIA_API_KEY' : 'OPENAI_API_KEY';
      try {
        await db.setting.upsert({
          where: { key: dbKey },
          update: { value: apiKey },
          create: { key: dbKey, value: apiKey },
        });
      } catch {
        // ignorar fallo de DB
      }
    }

    return NextResponse.json({ ok: true, message: 'Configuración de proveedor guardada' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
