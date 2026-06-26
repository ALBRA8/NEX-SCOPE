import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * GET /api/auth/me
 * 
 * Returns the currently authenticated user based on the httpOnly JWT cookie.
 * Used by the client to verify auth state on page load.
 * 
 * Unlike the previous implementation, this route does NOT accept a userId
 * query parameter. The user is determined solely by the JWT in the cookie,
 * which is cryptographically signed and cannot be tampered with.
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
    console.error('Me error:', error);
    return NextResponse.json(
      { success: false, authenticated: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
