import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  // ━━ Auth gate ━━
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Cuerpo de la petición inválido' }, { status: 400 });
    }
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages es requerido y debe ser un array no vacío' },
        { status: 400 }
      );
    }

    // Cap message count and per-message content length to protect both the
    // upstream AI (cost / context overflow) and the database from oversized
    // payloads (an attacker could otherwise send 10k messages of 100k chars).
    const MAX_MESSAGES = 50;
    const MAX_MSG_CONTENT = 8000;
    type ChatRole = 'user' | 'assistant' | 'system';
    const safeMessages: { role: ChatRole; content: string }[] = messages
      .filter((m: any) => m && typeof m === 'object' && typeof m.content === 'string')
      .slice(-MAX_MESSAGES)
      .map((m: any) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as ChatRole,
        content: m.content.slice(0, MAX_MSG_CONTENT),
      }));

    if (safeMessages.length === 0) {
      return NextResponse.json(
        { error: 'messages debe contener al menos un mensaje válido' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en YouTube y creación de contenido. Ayudas a los usuarios a encontrar nichos rentables, analizar canales y crear estrategias de contenido. Responde siempre en español. Sé conciso pero informativo. Proporciona datos y consejos prácticos.'
        },
        ...safeMessages,
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'La IA no devolvió contenido. Intenta reformular tu mensaje.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ content, source: 'ai' });
  } catch (error: any) {
    logError('Chat API', error);

    const isNetworkError =
      error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.cause?.code === 'ECONNREFUSED' ||
      error?.cause?.code === 'ENOTFOUND' ||
      error?.name === 'TypeError' ||
      /fetch failed|connect timeout|network/i.test(error?.message || '');

    if (isNetworkError) {
      return NextResponse.json(
        {
          error: 'El servicio de IA no está disponible en este entorno. Verifica la conexión de red del servidor.',
          code: 'AI_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error al procesar tu mensaje. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
