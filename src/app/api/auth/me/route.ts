import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user based on the httpOnly JWT cookie.
 * Used by the client to verify auth state on page load.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (error) {
    logError('Me', error);
    return NextResponse.json(
      { success: false, authenticated: false, error: safeErrorMessage(error, 'Error interno del servidor') },
      { status: 500 }
    );
  }
}
