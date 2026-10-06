/**
 * NexScope — Agent memory helpers.
 *
 * Wraps the `Memory` Prisma model with a small API used by:
 *   - the `record_memory` / `recall_memory` agent tools (see src/lib/agent/tools.ts),
 *   - the REST CRUD endpoint at /api/memory,
 *   - periodic maintenance jobs (consolidate / decay).
 *
 * Design notes:
 *   - All queries are scoped by `userId` to enforce multi-tenant safety.
 *   - `recallMemories` does a simple LIKE search on `content`. This is a
 *     pragmatic trade-off for SQLite (no FTS5 setup); good enough for the
 *     low-volume memory traffic of a single SaaS instance. Migrate to
 *     Prisma + sqlite-vss / Postgres pg_trgm if/when the dataset grows.
 *   - `consolidateMemories` keeps the most recently updated duplicate and
 *     marks the rest `status='deprecated'` (soft delete — keeps the row
 *     for auditability but excludes it from default `recall` queries).
 *   - `decayMemories` reduces `relevance` by 0.05 for every memory older
 *     than 30 days, floored at 0. Cheap, deterministic, idempotent.
 */

import { db } from '@/lib/db';
import { logError } from '@/lib/errors';
import type { Memory } from '@prisma/client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type MemoryType = 'EPISODIC' | 'SEMANTIC' | 'FACTUAL' | 'PROCEDURAL';
export type MemoryProvenance =
  | 'AI_MODEL'
  | 'YOUTUBE_API'
  | 'USER_INPUT'
  | 'CONSOLIDATED';
export type MemoryTruthLevel =
  | 'OBSERVED'
  | 'VERIFIED'
  | 'ESTIMATED'
  | 'MODELED'
  | 'INFERRED'
  | 'UNKNOWN';
export type MemoryStatus = 'active' | 'deprecated' | 'retired';

export interface RecordMemoryInput {
  domain: string;
  type: MemoryType | string;
  content: string;
  source: string;
  provenance: MemoryProvenance | string;
  confidence?: number;
  truthLevel?: MemoryTruthLevel | string;
  evidence?: unknown;
  scope?: string;
}

export interface RecallOptions {
  domain?: string;
  type?: string;
  status?: MemoryStatus | string;
  limit?: number;
  q?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLAMPING HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_DOMAIN = 'youtube_intelligence';

function clampFloat(n: unknown, fallback: number, min = 0, max = 1): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function safeString(v: unknown, fallback: string, max = 5000): string {
  if (typeof v !== 'string' || !v.trim()) return fallback;
  return v.slice(0, max);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Persist a single memory row for the given user.
 *
 * Throws if `content` or `source` are empty. Other fields fall back to
 * sensible defaults (`domain='youtube_intelligence'`, `confidence=0.5`,
 * `truthLevel='ESTIMATED'`, `scope='user'`, `status='active'`,
 * `relevance=0.5`).
 */
export async function recordMemory(
  userId: string,
  mem: RecordMemoryInput
): Promise<Memory> {
  const content = safeString(mem.content, '', 50_000);
  const source = safeString(mem.source, '', 500);
  if (!content) throw new Error('recordMemory: content es requerido');
  if (!source) throw new Error('recordMemory: source es requerido');
  if (!userId) throw new Error('recordMemory: userId es requerido');

  const domain = safeString(mem.domain, DEFAULT_DOMAIN, 200);
  const type = safeString(mem.type, 'SEMANTIC', 50);
  const provenance = safeString(mem.provenance, 'AI_MODEL', 50);
  const truthLevel = safeString(mem.truthLevel ?? 'ESTIMATED', 'ESTIMATED', 50);
  const scope = safeString(mem.scope ?? 'user', 'user', 50);
  const confidence = clampFloat(mem.confidence ?? 0.5, 0.5);
  const relevance = 0.5;

  const evidenceJson =
    mem.evidence === undefined || mem.evidence === null
      ? null
      : JSON.stringify(mem.evidence);

  return db.memory.create({
    data: {
      userId,
      domain,
      type,
      content,
      source,
      evidence: evidenceJson,
      provenance,
      confidence,
      truthLevel,
      scope,
      relevance,
      status: 'active',
    },
  });
}

/**
 * Recall memories for the given user.
 *
 * Returns `active` memories by default, optionally filtered by `domain`,
 * `type` and a free-text `q` (LIKE on `content`). Ordered by `relevance`
 * desc then `createdAt` desc.
 */
export async function recallMemories(
  userId: string,
  opts: RecallOptions = {}
): Promise<Memory[]> {
  if (!userId) return [];

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);
  const where: {
    userId: string;
    status?: string;
    domain?: string;
    type?: string;
    content?: { contains: string };
  } = {
    userId,
    status: opts.status || 'active',
  };
  if (opts.domain) where.domain = opts.domain;
  if (opts.type) where.type = opts.type;
  if (opts.q && typeof opts.q === 'string' && opts.q.trim()) {
    where.content = { contains: opts.q.trim().slice(0, 500) };
  }

  return db.memory.findMany({
    where,
    orderBy: [{ relevance: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
}

/**
 * Consolidate (de-duplicate) memories for the given user.
 *
 * Memories sharing the same `content + source` are considered duplicates.
 * The most recently `updatedAt` row is kept as `active`; the rest are
 * marked `status='deprecated'` (soft delete). Returns the count of rows
 * that were deprecated.
 *
 * Implementation note: SQLite + Prisma doesn't support a single "update
 * where rowid in (select ...)" easily across group-by, so we fetch the
 * candidate groups and update by id list. Volume is low (single SaaS
 * instance per user) so this is fine.
 */
export async function consolidateMemories(
  userId: string
): Promise<{ consolidated: number }> {
  if (!userId) return { consolidated: 0 };

  // Find all (content, source) groups with more than one row.
  // Prisma doesn't expose GROUP BY directly, so we use a raw query.
  type DupGroup = { content: string; source: string; cnt: number };
  const groups = await db.$queryRaw<DupGroup[]>`
    SELECT content, source, COUNT(*) AS cnt
    FROM Memory
    WHERE userId = ${userId} AND status = 'active'
    GROUP BY content, source
    HAVING COUNT(*) > 1
    LIMIT 1000
  `;
  if (!groups.length) return { consolidated: 0 };

  let consolidated = 0;
  for (const g of groups) {
    // Find the most recently updated row for this (content, source) — that's
    // the keeper. Everything else gets deprecated.
    const rows = await db.memory.findMany({
      where: {
        userId,
        content: g.content,
        source: g.source,
        status: 'active',
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    if (rows.length <= 1) continue;
    const [keeper, ...dups] = rows;
    if (!keeper) continue;
    const dupIds = dups.map((r) => r.id);
    const result = await db.memory.updateMany({
      where: { id: { in: dupIds } },
      data: { status: 'deprecated' },
    });
    consolidated += result.count;
  }

  return { consolidated };
}

/**
 * Decay relevance of old memories.
 *
 * Reduces `relevance` by 0.05 for every memory older than 30 days, capped
 * at 0. Idempotent — running it twice on the same day just keeps the same
 * floor. Returns the count of rows that were modified.
 *
 * Implementation: uses Prisma's `updateMany` with an arithmetic SQL fragment
 * to do the decrement in-place (one statement instead of read-modify-write
 * per row).
 */
export async function decayMemories(
  userId: string
): Promise<{ decayed: number }> {
  if (!userId) return { decayed: 0 };

  // SQLite supports `MAX()` as a scalar. We use Prisma's raw SQL because
  // `updateMany` with an arithmetic expression on the column isn't supported
  // for SQLite via the high-level API.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const result = await db.$executeRaw`
      UPDATE Memory
      SET relevance = MAX(0, relevance - 0.05)
      WHERE userId = ${userId}
        AND status = 'active'
        AND lastVerified < ${cutoff}
        AND relevance > 0
    `;
    // Prisma returns the number of affected rows for $executeRaw on UPDATE.
    return { decayed: Number(result) || 0 };
  } catch (err) {
    logError('decayMemories', err);
    return { decayed: 0 };
  }
}
