import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import {
  verifyPassword,
  migratePasswordToBcrypt,
  signToken,
  setAuthCookie,
} from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

// A precomputed dummy hash used to run bcrypt when the user is not found.
// This keeps the response time roughly constant whether the email exists or
// not, mitigating user-enumeration timing attacks. Cost is one bcrypt hash
// per request (≈100 ms) which is the same cost as the happy path.
const DUMMY_BCRYPT_HASH =
  '$2a$10$CwTycUXgup02fXkAQKkLLeRv9Aa5QJF2nQUaZQqBkUF0d8d3a3abC';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Cuerpo de la petición inválido' },
        { status: 400 }
      );
    }
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Basic length cap to avoid DoS via huge passwords.
    if (password.length > 1024) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Run bcrypt anyway so the response time matches the happy path.
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const { valid, needsMigration } = await verifyPassword(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (needsMigration) {
      await migratePasswordToBcrypt(user.id, password);
    }

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
    logError('Login', error);
    return NextResponse.json(
      { success: false, error: safeErrorMessage(error, 'Error interno del servidor') },
      { status: 500 }
    );
  }
}
