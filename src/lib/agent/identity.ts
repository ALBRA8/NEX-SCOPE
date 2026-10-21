/**
 * NexScope Agent — Identity System
 * Paridad con ALBRA AGENT SEED V1.0 (AGENTE-GENERAL)
 *
 * Administra el nombre, rol e instrucciones de comportamiento del agente.
 */

import { db } from '@/lib/db';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export interface AgentIdentity {
  name: string;
  role: string;
  system_instructions?: string;
}

const IDENTITY_FILE = path.join(process.cwd(), '.agent-identity.json');

export const DEFAULT_IDENTITY: AgentIdentity = {
  name: 'AGENTE GENERAL',
  role: 'asistente de IA de NexScope experto en YouTube, investigación de nichos, estrategia de contenido, optimización de CTR, SEO y producción de video',
  system_instructions: 'Respondes en español de forma precisa, profesional y orientada a la acción. Utilizas herramientas para operar el sistema cuando el usuario te pide datos, cálculos, títulos, guiones o etiquetas.',
};

export async function getAgentIdentity(): Promise<AgentIdentity> {
  // 1. Intentar archivo JSON
  try {
    const data = await readFile(IDENTITY_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return { ...DEFAULT_IDENTITY, ...parsed };
  } catch {
    // ignorar
  }

  // 2. Intentar DB Setting
  try {
    const setting = await db.setting.findUnique({ where: { key: 'AGENT_IDENTITY' } });
    if (setting?.value) {
      return { ...DEFAULT_IDENTITY, ...JSON.parse(setting.value) };
    }
  } catch {
    // ignorar
  }

  return DEFAULT_IDENTITY;
}

export async function saveAgentIdentity(identity: Partial<AgentIdentity>): Promise<AgentIdentity> {
  const current = await getAgentIdentity();
  const updated: AgentIdentity = {
    name: identity.name?.trim() || current.name,
    role: identity.role?.trim() || current.role,
    system_instructions: identity.system_instructions?.trim() || current.system_instructions,
  };

  try {
    await writeFile(IDENTITY_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    // ignorar fallo de archivo
  }

  try {
    await db.setting.upsert({
      where: { key: 'AGENT_IDENTITY' },
      update: { value: JSON.stringify(updated) },
      create: { key: 'AGENT_IDENTITY', value: JSON.stringify(updated) },
    });
  } catch {
    // ignorar fallo de DB
  }

  return updated;
}
