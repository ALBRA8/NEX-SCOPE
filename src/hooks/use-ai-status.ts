'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AIStatus {
  available: boolean;
  error?: string;
  latencyMs?: number;
  loading: boolean;
  lastCheckedAt?: number;
}

const INITIAL: AIStatus = { available: false, loading: true };

/**
 * Polls /api/health to detect whether the Z.ai SDK can reach its upstream.
 * Result is cached server-side for 60s, so calling this from multiple views
 * is cheap.
 */
export function useAIStatus() {
  const [status, setStatus] = useState<AIStatus>(INITIAL);

  const check = useCallback(async () => {
    try {
      setStatus((prev) => ({ ...prev, loading: true }));
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json();
      setStatus({
        available: Boolean(data.available),
        error: data.error,
        latencyMs: data.latencyMs,
        loading: false,
        lastCheckedAt: Date.now(),
      });
    } catch {
      setStatus({
        available: false,
        error: 'No se pudo verificar el estado de la IA',
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { status, check };
}
