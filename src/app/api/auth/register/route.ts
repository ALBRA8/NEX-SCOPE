import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // ━━ Validation ━━
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // ━━ Check for existing user ━━
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una cuenta con este email' },
        { status: 400 }
      );
    }

    // ━━ Hash password with bcrypt ━━
    const hashedPassword = await hashPassword(password);

    // ━━ Create user ━━
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        password: hashedPassword,
      },
    });

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
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
