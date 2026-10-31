/**
 * NEX-SCOPE — Mesh inbound HMAC verification (CAZADOR fusion)
 *
 * Mirrors the CHISMOSO mesh webhook pattern
 * (`chismoso/src/mesh/webhook.ts::verifyInboundSignature`) so CAZADOR can
 * push structured affiliate offers / channel analyses / niche saves into
 * NEX-SCOPE over a signed webhook.
 *
 * Header convention:
 *   `X-Cazador-Signature: sha256=<hex-hmac>`
 * where `<hex-hmac>` = `HMAC-SHA256(rawBody, CAZADOR_WEBHOOK_SECRET)`.
 *
 * Security notes:
 *   - The secret is read from `process.env.CAZADOR_WEBHOOK_SECRET` — NEVER
 *     from the database. This keeps signing keys out of the SQLite file
 *     (same posture as CHISMOSO's per-agent env-var convention, audit H-8).
 *   - Comparison is constant-time via `crypto.timingSafeEqual` to prevent
 *     timing oracles.
 *   - When `CAZADOR_WEBHOOK_SECRET` is unset / empty the verifier returns
 *     `{ verified: true }` (open mode for dev). This mirrors CHISMOSO's
 *     "no secret configured → open inbound" transitional posture, but we
 *     log a warning so the operator notices in production.
 *   - The computed digest is never returned to the caller for client
 *     responses — it would let an attacker oracle the HMAC byte-by-byte.
 */

import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface CazadorSignatureInput {
  /** Raw request body bytes (NOT the parsed JSON — order/whitespace matters). */
  rawBody: string;
  /** Value of the `X-Cazador-Signature` header (`sha256=<hex>` or empty). */
  signatureHeader: string | null | undefined;
  /** Shared secret with the sender. If empty/undefined, verification is SKIPPED. */
  secret?: string | null;
}

export interface CazadorSignatureResult {
  /** True if verification passed OR was skipped (no secret configured). */
  verified: boolean;
  /**
   * Always present when `verified === false`. The caller SHOULD surface this
   * in the 401 response body's `details.reason` field so the client can
   * distinguish the failure mode.
   */
  reason?:
    | 'no_secret_configured_open_inbound'
    | 'missing_signature_header'
    | 'malformed_signature_header'
    | 'signature_mismatch';
}

/** Header name used to transport the HMAC. */
export const CAZADOR_SIGNATURE_HEADER = 'X-Cazador-Signature';

/** Env var that holds the shared HMAC secret. */
export const CAZADOR_WEBHOOK_SECRET_ENV = 'CAZADOR_WEBHOOK_SECRET';

/**
 * Read the CAZADOR webhook secret from the environment. Returns `undefined`
 * when unset / empty. Kept separate so callers can decide whether to log
 * the "open inbound" warning once per request.
 */
export function getCazadorWebhookSecret(): string | undefined {
  const v = process.env[CAZADOR_WEBHOOK_SECRET_ENV];
  return v && v.length > 0 ? v : undefined;
}

/**
 * Verify the inbound `X-Cazador-Signature` header against the raw request
 * body. Returns `{ verified: true }` when:
 *   - The secret is missing/unset — inbound verification is silently
 *     skipped (legacy / dev posture; caller logs for visibility).
 *   - The signature header is present and matches
 *     `HMAC-SHA256(rawBody, secret)` in constant time.
 *
 * Returns `{ verified: false, reason }` when:
 *   - The secret IS configured but the header is missing → 401.
 *   - The header is malformed (not `sha256=<hex>`) → 401.
 *   - The header is present but the HMAC doesn't match → 401.
 *
 * The caller MUST read the raw request body BEFORE parsing it as JSON —
 * the signature is over the exact bytes the sender sent, not a
 * re-serialized form.
 */
export function verifyCazadorSignature(
  input: CazadorSignatureInput,
): CazadorSignatureResult {
  const { rawBody, signatureHeader, secret } = input;

  // No secret configured → inbound is open (same posture as CHISMOSO V1.0).
  // The caller logs this for visibility but accepts the request.
  if (!secret || secret.length === 0) {
    return {
      verified: true,
      reason: 'no_secret_configured_open_inbound',
    };
  }

  // Secret IS configured → header MUST be present + well-formed.
  if (!signatureHeader || signatureHeader.length === 0) {
    return { verified: false, reason: 'missing_signature_header' };
  }

  // Header format: `sha256=<hex>`. Reject anything else.
  const prefix = 'sha256=';
  if (!signatureHeader.startsWith(prefix)) {
    return { verified: false, reason: 'malformed_signature_header' };
  }
  const receivedHex = signatureHeader.slice(prefix.length);
  if (!/^[a-fA-F0-9]{64}$/.test(receivedHex)) {
    return { verified: false, reason: 'malformed_signature_header' };
  }

  // Compute the expected HMAC over the raw body.
  const bodyBuf = Buffer.from(rawBody, 'utf8');
  const expectedHex = createHmac('sha256', secret).update(bodyBuf).digest('hex');

  // Constant-time compare (compare the hex strings as UTF-8 buffers).
  const received = Buffer.from(receivedHex, 'utf8');
  const expected = Buffer.from(expectedHex, 'utf8');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { verified: false, reason: 'signature_mismatch' };
  }
  return { verified: true };
}

/**
 * Convenience wrapper: pulls the secret from env and the signature header
 * off the NextRequest for the caller. Returns the verification result and
 * logs the open-inbound warning when applicable.
 *
 * Usage:
 *   ```ts
 *   const rawBody = await req.text();
 *   const result = verifyCazadorSignatureFromRequest(req, rawBody);
 *   if (!result.verified) {
 *     return NextResponse.json({ error: 'Unauthorized', details: { reason: result.reason } }, { status: 401 });
 *   }
 *   ```
 */
export function verifyCazadorSignatureFromRequest(
  req: NextRequest,
  rawBody: string,
): CazadorSignatureResult {
  const secret = getCazadorWebhookSecret();
  const signatureHeader = req.headers.get(CAZADOR_SIGNATURE_HEADER);
  const result = verifyCazadorSignature({ rawBody, signatureHeader, secret });
  if (result.verified && result.reason === 'no_secret_configured_open_inbound') {
    // Single warning per request — keep it terse so logs stay readable.
    console.warn(
      '[mesh] CAZADOR_WEBHOOK_SECRET is not set — accepting inbound signal in open mode. Set the env var in production.',
    );
  }
  return result;
}
