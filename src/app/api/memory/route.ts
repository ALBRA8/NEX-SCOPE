/**
 * NexScope — Memory REST CRUD endpoint.
 *
 *   GET    /api/memory                  — list current user's memories
 *   POST   /api/memory                  — record a new memory
 *   DELETE /api/memory?id=...           — soft-delete (status='retired')
 *
 * All requests require an authenticated session (nexscope_token cookie).
 * Multi-tenant safety: every query is filtered by `userId` from the JWT,
 * never from the request body.
 *
 * The agent's `recall_memory` / `record_memory` tools call the helpers in
 * `src/lib/memory.ts` directly (no HTTP hop); this endpoint is the
 * manual/admin surface.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';
import { db } from '@/lib/db';
import {
  recordMemory,
  recallMemories,
  consolidateMemories,
  decayMemories,
} from '@/lib/memory';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/memory — list memories
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Query params (all optional):
//   domain=..., type=..., status=..., q=..., limit=...
//   action=consolidate | decay  — run maintenance tasks instead of listing.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Maintenance shortcuts (admin surface). They are still scoped to the
    // authenticated user — no global purge here.
    if (action === 'consolidate') {
      const result = await consolidateMemories(user.id);
      return NextResponse.json(result);
    }
    if (action === 'decay') {
      const result = await decayMemories(user.id);
      return NextResponse.json(result);
    }

    const memories = await recallMemories(user.id, {
      domain: searchParams.get('domain') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      limit: Number(searchParams.get('limit')) || undefined,
      q: searchParams.get('q') || undefined,
    });

    return NextResponse.json({ count: memories.length, memories });
  } catch (error) {
    logError('memory GET', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al recuperar memorias') },
      { status: 500 }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/memory — record a new memory
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Body: { domain, type, content, source, provenance, confidence?, truthLevel?, evidence? }
// `provenance` for manually-created memories defaults to 'USER_INPUT'.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
    }

    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const source =
      typeof body.source === 'string'
        ? body.source.trim()
        : `user:${user.id}`;
    if (!content) {
      return NextResponse.json(
        { error: 'content es requerido' },
        { status: 400 }
      );
    }

    const memory = await recordMemory(user.id, {
      domain: typeof body.domain === 'string' ? body.domain : 'youtube_intelligence',
      type: typeof body.type === 'string' ? body.type : 'SEMANTIC',
      content,
      source,
      provenance: typeof body.provenance === 'string' ? body.provenance : 'USER_INPUT',
      confidence: typeof body.confidence === 'number' ? body.confidence : 0.7,
      truthLevel: typeof body.truthLevel === 'string' ? body.truthLevel : 'ESTIMATED',
      evidence: body.evidence,
    });

    return NextResponse.json({ memory, recorded: true });
  } catch (error) {
    logError('memory POST', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al guardar memoria') },
      { status: 500 }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/memory?id=... — soft-delete (status='retired')
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido (query param ?id=...)' },
        { status: 400 }
      );
    }

    // Soft-delete: only the row belonging to the authenticated user can
    // be retired. Hard delete is intentionally not exposed via HTTP —
    // audit trail is preserved.
    const result = await db.memory.updateMany({
      where: { id, userId: user.id },
      data: { status: 'retired' },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Memoria no encontrada (o no pertenece al usuario)' },
        { status: 404 }
      );
    }
    return NextResponse.json({ retired: true });
  } catch (error) {
    logError('memory DELETE', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al borrar memoria') },
      { status: 500 }
    );
  }
}
