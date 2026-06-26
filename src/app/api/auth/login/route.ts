import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  migratePasswordToBcrypt,
  signToken,
  setAuthCookie,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // ━━ Verify password (supports both bcrypt and legacy base64) ━━
    const { valid, needsMigration } = await verifyPassword(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // ━━ Auto-migrate legacy base64 password to bcrypt ━━
    if (needsMigration) {
      await migratePasswordToBcrypt(user.id, password);
    }

    // ━━ Sign JWT and set httpOnly cookie ━━
    const token = signToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
