import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { niche, audience } = await req.json();

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un planificador de contenido experto en YouTube. Cuando se te da un nicho y audiencia, generas un plan de contenido de 30 videos y devuelves UNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "plan": [
    {
      "title": "título del video",
      "description": "breve descripción",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "estimatedViews": numero_estimado,
      "difficulty": "fácil|medio|difícil",
      "format": "Tutorial|Review|Análisis|Lista|Vlog|Q&A|Live|Entrevista|Serie|Noticias|Opinión",
      "week": numero_de_semana_1_a_10
    }
  ]
}
Genera exactamente 30 ideas de video. Los datos deben ser realistas y variados.`
        },
        {
          role: 'user',
          content: `Genera un plan de contenido de 30 videos para el nicho "${niche || 'Inteligencia Artificial & ML'}" con audiencia "${audience || 'Jóvenes de 18-35 años'}"`
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({ plan: parsed.plan });
    } catch {
      const mockPlan = [];
      const formats = ['Tutorial', 'Review', 'Análisis', 'Lista', 'Vlog', 'Q&A'];
      const difficulties = ['fácil', 'medio', 'difícil'];
      const n = niche || 'IA';
      for (let i = 0; i < 30; i++) {
        const week = Math.floor(i / 3) + 1;
        mockPlan.push({
          title: `Video ${i + 1}: Todo sobre ${n} - Parte ${i + 1}`,
          description: `Contenido enfocado en ${n} para la audiencia objetivo`,
          keywords: [n.toLowerCase(), 'tutorial', 'guía'],
          estimatedViews: Math.round(10000 + Math.random() * 40000),
          difficulty: difficulties[i % 3],
          format: formats[i % formats.length],
          week: Math.min(week, 10),
        });
      }
      return NextResponse.json({ plan: mockPlan });
    }
  } catch (error) {
    console.error('Content plan API error:', error);
    return NextResponse.json({ plan: [] }, { status: 500 });
  }
}
