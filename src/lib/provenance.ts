/**
 * NexScope — Data Provenance & Truth Level Contract
 *
 * CRITICAL: Every metric in the system must be classified by its truth level.
 * AI-generated metrics are ESTIMATED, never VERIFIED. This prevents
 * presenting LLM hypotheses as factual YouTube data.
 *
 * Truth levels (per the NexScope finalization spec):
 *   OBSERVED  — directly read from a primary source (e.g. YouTube API returned this exact number)
 *   VERIFIED  — confirmed against multiple sources
 *   ESTIMATED — derived from a model or heuristic (e.g. AI-generated, or computed from ranges)
 *   MODELED   — output of an analytical/computational model
 *   INFERRED  — deduced from indirect signals
 *   UNKNOWN   — we don't know, treat with caution
 */

export type TruthLevel =
  | 'OBSERVED'
  | 'VERIFIED'
  | 'ESTIMATED'
  | 'MODELED'
  | 'INFERRED'
  | 'UNKNOWN';

export type ProvenanceSource =
  | 'AI_MODEL'
  | 'YOUTUBE_API'
  | 'USER_INPUT'
  | 'CONSOLIDATED'
  | 'SYSTEM';

export interface Provenance {
  /** What produced this data */
  source: ProvenanceSource;
  /** Specific provider/model name (e.g. "zai-glm-5.2", "youtube-data-api-v3") */
  provider: string;
  /** When this data was generated/fetched */
  timestamp: string;
  /** Overall truth level for this payload (individual fields may have their own) */
  truthLevel: TruthLevel;
  /** Confidence 0..1 (1 = high confidence) */
  confidence: number;
  /** Human-readable note about how to interpret this data */
  note: string;
}

/**
 * Standard provenance wrapper for AI-generated data.
 * Use this on every API endpoint that returns AI-generated metrics.
 */
export function aiProvenance(provider = 'zai-glm-5.2', note?: string): Provenance {
  return {
    source: 'AI_MODEL',
    provider,
    timestamp: new Date().toISOString(),
    truthLevel: 'ESTIMATED',
    confidence: 0.5,
    note:
      note ??
      'Los valores numéricos son estimaciones generadas por un modelo de lenguaje. No son datos oficiales de YouTube. Úsalos como hipótesis, no como hechos verificables.',
  };
}

/**
 * Provenance for data fetched directly from the YouTube Data API.
 */
export function youTubeProvenance(provider = 'youtube-data-api-v3'): Provenance {
  return {
    source: 'YOUTUBE_API',
    provider,
    timestamp: new Date().toISOString(),
    truthLevel: 'OBSERVED',
    confidence: 1.0,
    note: 'Datos leídos directamente de la YouTube Data API v3.',
  };
}

/**
 * Wraps any payload with a top-level `_provenance` field.
 * Use at the end of API handlers: `NextResponse.json(wrapWithProvenance(data, prov))`
 */
export function wrapWithProvenance<T>(data: T, provenance: Provenance): T & { _provenance: Provenance } {
  return { ...data, _provenance: provenance };
}

/**
 * Add a `truthLevel` field to every numeric/metric field in a flat object.
 * Used by AI tools/endpoints that return metrics.
 */
export function markEstimated<T extends Record<string, unknown>>(obj: T): T {
  // We do NOT mutate the data — we return it as-is. The truth_level is
  // communicated via the top-level _provenance wrapper. This helper exists
  // for endpoints that want to add per-field `truthLevel` markers in the
  // future without changing the API shape.
  return obj;
}
