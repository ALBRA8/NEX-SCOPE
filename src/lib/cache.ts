/**
 * Tiny in-memory TTL cache for AI endpoints.
 *
 * Trade-offs:
 *   - In-memory → single-instance deployments only (PM2, Docker, standalone).
 *     On Vercel every serverless invocation can land on a fresh instance.
 *   - Bounded FIFO eviction at MAX_ENTRIES to prevent unbounded growth.
 *   - Server-side only. Never store auth or PII in here.
 */

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

const MAX_ENTRIES = 1000;
const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<V>(key: string): V | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as V;
}

export function cacheSet<V>(key: string, value: V, ttlMs: number): void {
  if (store.size >= MAX_ENTRIES && !store.has(key)) {
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) store.delete(firstKey);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function buildCacheKey(...parts: (string | number)[]): string {
  return parts
    .map((p) => String(p).trim().toLowerCase().slice(0, 200))
    .join('::');
}

export function cacheClear(): void {
  store.clear();
}
