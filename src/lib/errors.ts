/**
 * Safe error helpers for API routes.
 *
 * Avoids leaking internal stack traces / DB internals to the client.
 * In production, returns a generic message and logs the real error server-side.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Returns a sanitized error message suitable for the API response body.
 * In development we leak the message for easier debugging; in production we
 * return a generic string and let the caller log the real error.
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && !IS_PROD) {
    return error.message;
  }
  return fallback;
}

/**
 * Internal: extract the original error message for server-side logging only.
 */
export function logError(prefix: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${prefix}]`, error.message, error.stack);
  } else {
    console.error(`[${prefix}]`, error);
  }
}
