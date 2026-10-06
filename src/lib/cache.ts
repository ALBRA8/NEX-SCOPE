/**
 * Tiny in-memory TTL cache for AI endpoints.
 *
 * Why this exists:
 *   POST /api/trends and POST /api/keywords take 5–95 s each because they
 *   hit the Z.ai LLM. Multiple users hitting the same niche within the TTL
 *   would otherwise each pay that latency and quota cost. With a 30–90 s
 *   in-process cache, the second call is ~instant.
 *
 * Trade-offs / when NOT to rely on this:
 *   - In-memory → works only for single-instance deployments (PM2, Docker,
 *     `next start`, the standalone server). On Vercel every serverless
 *     invocation can land on a fresh instance and the cache will be cold;
 *     use Upstash Redis for shared cache in that case.
 *   - No LRU eviction — entries self-expire via the TTL, but in pathological
 *     cases (thousands of distinct keys) the Map grows unbounded. Acceptable
 *     here because the key-space is `niche[:200]` strings; cap it if you
 *     ever start caching per-user data.
 *   - Not part of the public API surface; only intended for server-side
 *     AI endpoints. Never store auth or PII in here.
 */

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Read a value from the cache. Returns `undefined` on miss or expired entry.
 * Side effect: expired entries are deleted on access (lazy eviction).
 */
export function cacheGet<V>(key: string): V | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as V;
}

/**
 * Write a value into the cache with the given TTL (ms).
 */
export function cacheSet<V>(key: string, value: V, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Build a stable cache key from the endpoint name + the (already sanitized)
 * input that determines the response. Keep the inputs short and lowercased
 * so equivalent queries collide.
 */
export function buildCacheKey(...parts: (string | number)[]): string {
  return parts
    .map((p) => String(p).trim().toLowerCase().slice(0, 200))
    .join('::');
}

/**
 * Test hook / admin: clear the whole cache. Not exposed via HTTP — only
 * intended for unit tests or a future admin endpoint.
 */
export function cacheClear(): void {
  store.clear();
}
