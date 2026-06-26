/**
 * NexScope - Secure Authentication Library
 * 
 * Provides:
 * - Password hashing with bcrypt (10 rounds)
 * - JWT token signing and verification
 * - httpOnly cookie management for sessions
 * - Backward compatibility with legacy base64 passwords
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = 'nexscope_token';
const BCRYPT_ROUNDS = 10;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PASSWORD HASHING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Hash a plaintext password using bcrypt.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored hash.
 * 
 * Supports:
 * 1. Bcrypt hashes (preferred, start with $2a$, $2b$, $2y$)
 * 2. Legacy base64-encoded passwords (auto-migrates to bcrypt on success)
 */
export async function verifyPassword(
  plaintext: string,
  stored: string
): Promise<{ valid: boolean; needsMigration: boolean }> {
  // Detect bcrypt hash by prefix
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    const valid = await bcrypt.compare(plaintext, stored);
    return { valid, needsMigration: false };
  }

  // Legacy base64 fallback (existing users from before this update)
  const legacyHash = Buffer.from(plaintext).toString('base64');
  if (legacyHash === stored) {
    return { valid: true, needsMigration: true };
  }

  return { valid: false, needsMigration: false };
}

/**
 * Migrate a user's password from base64 to bcrypt.
 * Called automatically after a successful legacy login.
 */
export async function migratePasswordToBcrypt(
  userId: string,
  plaintext: string
): Promise<void> {
  try {
    const hashed = await hashPassword(plaintext);
    await db.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    console.log(`[auth] Password migrated to bcrypt for user ${userId}`);
  } catch (error) {
    console.error('[auth] Failed to migrate password:', error);
    // Non-fatal: user can still log in next time via legacy path
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JWT MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Sign a JWT token for a user.
 */
export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verify a JWT token and return the payload.
 * Returns null if invalid or expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COOKIE MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Set the auth cookie on a NextResponse.
 * Uses httpOnly + secure + sameSite='lax' for XSS/CSRF protection.
 */
export function setAuthCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}

/**
 * Clear the auth cookie on a NextResponse (logout).
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/**
 * Extract and verify the auth token from a NextRequest.
 * Returns the JWT payload if valid, null otherwise.
 */
export function getAuthFromRequest(
  request: NextRequest
): JwtPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get the authenticated user from a request.
 * Returns the user record from DB if the JWT is valid, null otherwise.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthUser | null> {
  const payload = getAuthFromRequest(request);
  if (!payload) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error('[auth] Error fetching authenticated user:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIDDLEWARE HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Returns true if a request has a valid auth token.
 * Use this in API routes to gate access.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ authenticated: boolean; user: AuthUser | null }> {
  const user = await getAuthenticatedUser(request);
  return { authenticated: user !== null, user };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLIENT-SIDE AUTH (for Zustand store)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Client-side check: is the user authenticated?
 * Calls /api/auth/me which reads the httpOnly cookie.
 */
export async function checkClientAuth(): Promise<{
  authenticated: boolean;
  user: AuthUser | null;
}> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return { authenticated: false, user: null };
    const data = await res.json();
    if (data.success && data.user) {
      return { authenticated: true, user: data.user };
    }
    return { authenticated: false, user: null };
  } catch {
    return { authenticated: false, user: null };
  }
}

/**
 * Client-side: stores minimal user info in localStorage for UI hydration.
 * The httpOnly cookie is the source of truth; this is only for UX (showing
 * the user's name/email in the UI without making a network request on every page load).
 */
export function cacheUserLocally(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  const STORAGE_KEY = 'nexscope_user_cache';
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Client-side: read cached user info from localStorage (for initial UI hydration only).
 */
export function getCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const STORAGE_KEY = 'nexscope_user_cache';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}
