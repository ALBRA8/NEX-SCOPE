import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/settings — retrieve all settings (values masked for sensitive keys)
export async function GET() {
  try {
    const settings = await db.setting.findMany({
      orderBy: { category: 'asc' },
    });

    // Mask sensitive values for display
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
    console.error('[Settings GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/settings — save or update a setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, category } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Validate known API key types
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

    // If value is empty, delete the setting
    if (!value || value.trim() === '') {
      await db.setting.deleteMany({ where: { key } });
      return NextResponse.json({ success: true, deleted: true });
    }

    // Upsert the setting
    const setting = await db.setting.upsert({
      where: { key },
      update: { value, category: category || 'api-keys' },
      create: { key, value, category: category || 'api-keys' },
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
    console.error('[Settings POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/settings — delete a setting by key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await db.setting.deleteMany({ where: { key } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error('[Settings DELETE Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
