import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

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

    const content = response.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
    }, { status: 500 });
  }
}
