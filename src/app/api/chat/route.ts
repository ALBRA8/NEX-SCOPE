import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages es requerido y debe ser un array no vacío' },
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
        ...messages,
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
    console.error('Chat API error:', error);

    // Detect network errors (SDK can't reach upstream)
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
      {
        error: 'Error al procesar tu mensaje. Intenta de nuevo.',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
