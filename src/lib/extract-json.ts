/**
 * Robust JSON extraction from LLM responses.
 * LLMs often wrap JSON in markdown fences (```json ... ```) or add
 * preamble/postamble text. This utility finds and parses the JSON payload.
 */

export function extractJson<T = any>(content: string): T | null {
  if (!content || typeof content !== 'string') return null;

  // 1. Strip markdown code fences if present
  let text = content.trim();

  // Try direct parse first (fast path)
  try {
    return JSON.parse(text) as T;
  } catch {
    // fall through to extraction
  }

  // 2. Remove ```json ... ``` fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      text = fenceMatch[1].trim();
    }
  }

  // 3. Find the first { or [ and the matching last } or ]
  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');
  let start = -1;
  let openCh = '';
  let closeCh = '';

  if (firstObj === -1 && firstArr === -1) return null;
  if (firstObj === -1) { start = firstArr; openCh = '['; closeCh = ']'; }
  else if (firstArr === -1) { start = firstObj; openCh = '{'; closeCh = '}'; }
  else if (firstObj < firstArr) { start = firstObj; openCh = '{'; closeCh = '}'; }
  else { start = firstArr; openCh = '['; closeCh = ']'; }

  // Scan for the matching closing bracket, respecting strings and nesting
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = false; continue; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          // try repairing common issues: trailing commas
          const repaired = candidate
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
            .replace(/:\s*'([^']*)'/g, ': "$1"');
          try {
            return JSON.parse(repaired) as T;
          } catch {
            return null;
          }
        }
      }
    }
  }

  return null;
}
