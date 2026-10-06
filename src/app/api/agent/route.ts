import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';
import { runAgent } from '@/lib/agent/executor';

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }
  const { messages, message } = body;

  const history = Array.isArray(messages) ? messages : [];
  const userMessage = typeof message === 'string' ? message : (history.pop()?.content || '');

  if (!userMessage || typeof userMessage !== 'string') {
    return NextResponse.json({ error: 'message o messages es requerido' }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        for await (const event of runAgent(String(userMessage).slice(0, 6000), history.slice(-20), { userId: user.id, user })) {
          send(event);
          if (event.type === 'done' || event.type === 'error') break;
        }
      } catch (error: any) {
        logError('Agent API', error);
        const isNetworkError = /fetch failed|connect timeout|network|ECONNREFUSED|ENOTFOUND|UND_ERR_CONNECT_TIMEOUT/i.test(error?.message || '');
        if (isNetworkError) {
          send({ type: 'error', message: 'Servicio de IA no disponible. Intenta más tarde.', code: 'AI_UNAVAILABLE' });
        } else {
          send({ type: 'error', message: safeErrorMessage(error, 'Error del agente') });
        }
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
}
