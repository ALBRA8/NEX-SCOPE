import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * 
 * Clears the httpOnly JWT cookie, effectively logging the user out.
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
