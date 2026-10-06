import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

// GET /api/settings — retrieve all settings (values masked for sensitive keys)
// Requires authentication: anyone with a session can see masked keys, but
// anonymous users must NOT enumerate which keys are configured.
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const settings = await db.setting.findMany({
      orderBy: { category: 'asc' },
    });

    const masked = settings.map((s) => ({
      id: s.id,
      key: s.key,
      value: maskValue(s.key, s.value),
      hasValue: s.value.length > 0,
      category: s.category,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({ settings: masked });
  } catch (error: any) {
    logError('Settings GET', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Internal server error') },
      { status: 500 }
    );
  }
}

// POST /api/settings — save or update a setting
// NOTE: This endpoint stores API secrets into the database. Without auth,
// an anonymous attacker could overwrite the server's keys (e.g. swap the
// YouTube key for one tied to their own quota, or simply brick the service).
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido' },
        { status: 400 }
      );
    }
    const { key, value, category } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const validKeys = [
      'YOUTUBE_API_KEY',
      'OPENAI_API_KEY',
      'GOOGLE_AI_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
    ];

    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: `Invalid key: ${key}` }, { status: 400 });
    }

    // Cap value length to prevent a multi-MB POST from bloating the DB.
    const safeValue = typeof value === 'string' ? value.slice(0, 4096) : '';

    if (!safeValue || safeValue.trim() === '') {
      await db.setting.deleteMany({ where: { key } });
      return NextResponse.json({ success: true, deleted: true });
    }

    const setting = await db.setting.upsert({
      where: { key },
      update: { value: safeValue, category: category || 'api-keys' },
      create: { key, value: safeValue, category: category || 'api-keys' },
    });

    return NextResponse.json({
      success: true,
      setting: {
        id: setting.id,
        key: setting.key,
        value: maskValue(setting.key, setting.value),
        hasValue: setting.value.length > 0,
        category: setting.category,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error: any) {
    logError('Settings POST', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Internal server error') },
      { status: 500 }
    );
  }
}

// DELETE /api/settings — delete a setting by key
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await db.setting.deleteMany({ where: { key } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    logError('Settings DELETE', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Internal server error') },
      { status: 500 }
    );
  }
}

// Helper: get a raw (unmasked) setting value — used by other API routes
export async function getSettingValue(key: string): Promise<string | null> {
  try {
    const setting = await db.setting.findUnique({ where: { key } });
    return setting?.value || null;
  } catch {
    return null;
  }
}

// Helper: mask sensitive values for display
function maskValue(key: string, value: string): string {
  if (!value) return '';
  // Show first 4 and last 4 chars for API keys
  if (key.includes('KEY') || key.includes('SECRET')) {
    if (value.length <= 12) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  }
  return value;
}
