import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';

export interface ViralVideoItem {
  title: string;
  views: string;
  outlier_factor: string;
  published_days_ago: number;
  video_url: string;
}

export interface BreakoutChannel {
  id: string;
  channel_name: string;
  handle: string;
  avatar: string;
  channel_age_days: number;
  subscribers: string;
  video_count: number;
  niche: string;
  breakout_score: number;
  outlier_multiplier: string;
  growth_velocity: string;
  why_it_works: string;
  recommended_action: string;
  top_viral_videos: ViralVideoItem[];
}

function getFallbackBreakoutChannels(niche: string): BreakoutChannel[] {
  return [
    {
      id: 'chan_01',
      channel_name: 'Cronos Misterios AI',
      handle: '@cronosmisterios',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      channel_age_days: 41,
      subscribers: '12.4K',
      video_count: 9,
      niche: 'Misterio & Historias Faceless',
      breakout_score: 98,
      outlier_multiplier: '18.6x',
      growth_velocity: '+620 subs/día',
      why_it_works: 'Ganchos visuales con zoom dinámico en el segundo 1, narración con voz profunda y preguntas sin resolver al final que disparan comentarios.',
      recommended_action: 'Replicar el formato de relatos arqueológicos prohibidos usando estilo cinemático y música de tensión continua.',
      top_viral_videos: [
        {
          title: 'El artefacto sumerio que la ciencia se niega a analizar',
          views: '482K',
          outlier_factor: '22x',
          published_days_ago: 8,
          video_url: 'https://youtube.com/watch?v=mock1',
        },
        {
          title: 'Lo que encontraron en la cueva de Tayos en 1976',
          views: '210K',
          outlier_factor: '15x',
          published_days_ago: 16,
          video_url: 'https://youtube.com/watch?v=mock2',
        },
      ],
    },
    {
      id: 'chan_02',
      channel_name: 'NeuroRendimiento 1%',
      handle: '@neurorendimiento',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      channel_age_days: 58,
      subscribers: '18.9K',
      video_count: 14,
      niche: 'Productividad & Salud Mental',
      breakout_score: 94,
      outlier_multiplier: '12.2x',
      growth_velocity: '+480 subs/día',
      why_it_works: 'Simplifica papers científicos de Stanford y Huberman en protocolos de 4 pasos con tipografía grande y fondos oscuros de alta retención.',
      recommended_action: 'Cubrir rutinas de dopamina y trucos de sueño con formato de lista numerada y tono de autoridad médica accesible.',
      top_viral_videos: [
        {
          title: 'El hábito de 2 minutos que resetea tu dopamina según neurobiólogos',
          views: '365K',
          outlier_factor: '14x',
          published_days_ago: 12,
          video_url: 'https://youtube.com/watch?v=mock3',
        },
      ],
    },
    {
      id: 'chan_03',
      channel_name: 'Búnker Financiero',
      handle: '@bunkerfinanciero',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      channel_age_days: 29,
      subscribers: '8.1K',
      video_count: 6,
      niche: 'Finanzas & Inversión',
      breakout_score: 96,
      outlier_multiplier: '16.5x',
      growth_velocity: '+710 subs/día',
      why_it_works: 'Títulos de contraste extremo ("El error del que nadie habla") y gráficos limpios comparativos que detienen el scroll publicitario.',
      recommended_action: 'Atacar el nicho de cuentas de ahorro de alto rendimiento y comparativas de tarjetas de crédito sin rostro.',
      top_viral_videos: [
        {
          title: 'Por qué tener $10,000 en el banco es una trampa silenciosa',
          views: '310K',
          outlier_factor: '19x',
          published_days_ago: 5,
          video_url: 'https://youtube.com/watch?v=mock4',
        },
      ],
    },
    {
      id: 'chan_04',
      channel_name: 'IA Sin Rodeos',
      handle: '@iasinrodeos',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      channel_age_days: 67,
      subscribers: '26.3K',
      video_count: 19,
      niche: 'Tecnología & IA',
      breakout_score: 92,
      outlier_multiplier: '9.8x',
      growth_velocity: '+540 subs/día',
      why_it_works: 'Tutoriales relámpago de herramientas gratuitas de IA que reemplazan software de pago, ritmo ultra acelerado con zoom continuo.',
      recommended_action: 'Crear tutoriales de cómo automatizar tareas pesadas usando combinaciones de herramientas IA gratuitas.',
      top_viral_videos: [
        {
          title: '5 herramientas de IA gratuitas que parecen totalmente ilegales',
          views: '540K',
          outlier_factor: '11x',
          published_days_ago: 14,
          video_url: 'https://youtube.com/watch?v=mock5',
        },
      ],
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche') || 'General';
    const maxAge = searchParams.get('max_age') || '90';

    try {
      const zai = await ZAI.create();
      const prompt = `Actúa como un Algoritmo de Inteligencia Viral de Canales Ocultos (estilo Vanta / 1of10 / VidIQ Outliers).
Detecta canales de YouTube creados hace menos de ${maxAge} días que estén teniendo una explosión de visualizaciones anómalas (videos con 5x a 20x más vistas que su número de suscriptores) en el nicho "${niche}".

Devuelve entre 3 y 5 canales anómalos emergentes con análisis del truco de retención que usan y el desglose de su video más viral.

Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "channels": [
    {
      "id": "chan_01",
      "channel_name": "Nombre del Canal",
      "handle": "@handle",
      "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
      "channel_age_days": 35,
      "subscribers": "9.5K",
      "video_count": 8,
      "niche": "${niche}",
      "breakout_score": 96,
      "outlier_multiplier": "14.2x",
      "growth_velocity": "+520 subs/día",
      "why_it_works": "Explicación del truco de retención, edición o gancho que lo hace viral",
      "recommended_action": "Cómo replicar el nicho y brecha detectada",
      "top_viral_videos": [
        {
          "title": "Título del video anómalo con más de 100k views",
          "views": "320K",
          "outlier_factor": "16x",
          "published_days_ago": 6,
          "video_url": "https://youtube.com"
        }
      ]
    }
  ]
}`;

      const aiRes = await zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = aiRes.choices[0]?.message?.content || '';
      const parsed = extractJson(raw);
      if (parsed && Array.isArray(parsed.channels) && parsed.channels.length > 0) {
        return NextResponse.json({ ok: true, source: 'vanta_intelligence_ai', channels: parsed.channels });
      }
    } catch (aiErr) {
      logError('breakout-channels:ai-error', aiErr);
    }

    const fallback = getFallbackBreakoutChannels(niche);
    return NextResponse.json({ ok: true, source: 'fallback_intelligence', channels: fallback });
  } catch (err: any) {
    logError('breakout-channels:unhandled', err);
    return NextResponse.json({ error: err.message || 'Error escaneando canales anómalos' }, { status: 500 });
  }
}
