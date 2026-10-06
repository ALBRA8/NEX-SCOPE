import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { logError } from '@/lib/errors';

/**
 * POST /api/auth/logout
 *
 * Clears the httpOnly JWT cookie, effectively logging the user out.
 *
 * NOTE (security): We do not maintain a server-side denylist of revoked
 * JWTs. With the current 24h expiry, a stolen token remains valid up to
 * 24h after logout. If your threat model requires immediate revocation
 * (e.g. admin-initiated forced logout), add a denylist backed by Redis/
 * Upstash with a TTL equal to the JWT expiry. See audit-1 worklog.
 */
export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    logError('Logout', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
