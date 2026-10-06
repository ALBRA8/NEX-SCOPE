import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

// GET /api/chat-messages — list current user's chat history (oldest first)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const messages = await db.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 200, // cap to last 200 messages to keep payload sane
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (error: any) {
    logError('chat-messages GET', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al cargar mensajes') },
      { status: 500 }
    );
  }
}

// POST /api/chat-messages — persist a single message
// Body: { role: 'user'|'assistant', content: string }
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido' },
        { status: 400 }
      );
    }
    const { role, content } = body;

    if (!role || !content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'role y content son requeridos' },
        { status: 400 }
      );
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'role debe ser "user" o "assistant"' },
        { status: 400 }
      );
    }

    const message = await db.chatMessage.create({
      data: {
        role,
        content: String(content).slice(0, 10000), // safety cap
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (error: any) {
    logError('chat-messages POST', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al guardar mensaje') },
      { status: 500 }
    );
  }
}

// DELETE /api/chat-messages — clear the user's entire chat history
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await db.chatMessage.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    logError('chat-messages DELETE', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Error al borrar mensajes') },
      { status: 500 }
    );
  }
}
