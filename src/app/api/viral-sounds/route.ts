import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';

export interface ViralSound {
  id: string;
  title: string;
  artist: string;
  growth: string;
  video_count: string;
  mood: string;
  best_niche: string;
  suggested_pacing: 'fast' | 'normal' | 'slow';
  preview_url: string;
}

function getFallbackSounds(mood: string): ViralSound[] {
  return [
    {
      id: 'sound_1',
      title: 'Monkeys Spinning Monkeys (Speed Up)',
      artist: 'Kevin MacLeod / TikTok Remix',
      growth: '+410% esta semana',
      video_count: '890K videos',
      mood: 'Divertido / Curiosidad 😂',
      best_niche: 'Gadgets, Hacks de Cocina, Experimentos, Errores Comunes',
      suggested_pacing: 'fast',
      preview_url: 'https://www.tiktok.com/music/popular',
    },
    {
      id: 'sound_2',
      title: 'Suspense Cinematic Drone Bass',
      artist: 'SoundWave Studios',
      growth: '+320% en 14 días',
      video_count: '240K videos',
      mood: 'Misterio / Advertencia ⚠️',
      best_niche: 'Secretos Ocultos, Historias Reales, No compres antes de ver esto',
      suggested_pacing: 'normal',
      preview_url: 'https://www.tiktok.com/music/popular',
    },
    {
      id: 'sound_3',
      title: 'Time - Hans Zimmer (Lo-Fi Motivation)',
      artist: 'Chill Beats Collective',
      growth: '+275% este mes',
      video_count: '510K videos',
      mood: 'Motivación / Estoicismo 🧠',
      best_niche: 'Finanzas, Hábitos, Mentalidad, Productividad',
      suggested_pacing: 'slow',
      preview_url: 'https://www.tiktok.com/music/popular',
    },
    {
      id: 'sound_4',
      title: 'Phonk Brazil Drift Beat',
      artist: 'DJ Viral Club',
      growth: '+590% en 7 días',
      video_count: '1.2M videos',
      mood: 'Alta Energía / Impacto ⚡',
      best_niche: 'Fitness, Autos, Gadgets Masculinos, Antes y Después',
      suggested_pacing: 'fast',
      preview_url: 'https://www.tiktok.com/music/popular',
    },
    {
      id: 'sound_5',
      title: 'Cozy Morning Aesthetic Acoustic',
      artist: 'Nordic Strings',
      growth: '+180% esta semana',
      video_count: '340K videos',
      mood: 'Calma / Limpieza ✨',
      best_niche: 'Skincare, Belleza, Organización de Hogar, Unboxing Relax',
      suggested_pacing: 'normal',
      preview_url: 'https://www.tiktok.com/music/popular',
    },
  ];
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  try {
    const body = await req.json().catch(() => ({}));
    const mood = String(body.mood || 'Todos').trim();

    try {
      const zai = await ZAI.create();
      const prompt = `Actúa como un Curador de Tendencias de TikTok Creative Center y Analista de Música Viral.
Analiza los audios y canciones que están en tendencia esta semana en TikTok Reels y Shorts para el estilo "${mood}".
Devuelve entre 4 y 6 pistas virales con alta velocidad de crecimiento y recomendación de nicho.

Responde ÚNICAMENTE en JSON con esta estructura:
{
  "sounds": [
    {
      "id": "sound_1",
      "title": "Nombre de la pista o canción",
      "artist": "Artista o remixer",
      "growth": "+350% esta semana",
      "video_count": "450K videos",
      "mood": "Misterio / Advertencia",
      "best_niche": "Nichos recomendados",
      "suggested_pacing": "fast",
      "preview_url": "https://www.tiktok.com/music/popular"
    }
  ]
}
Valores de suggested_pacing permitidos: 'fast' | 'normal' | 'slow'.`;

      const aiRes = await zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = aiRes.choices[0]?.message?.content || '';
      const parsed = extractJson(raw);
      if (parsed && Array.isArray(parsed.sounds) && parsed.sounds.length > 0) {
        return NextResponse.json({ ok: true, source: 'ai_sounds', sounds: parsed.sounds });
      }
    } catch (aiErr) {
      logError('viral-sounds:ai-error', aiErr);
    }

    const fallback = getFallbackSounds(mood);
    return NextResponse.json({ ok: true, source: 'fallback_sounds', sounds: fallback });
  } catch (err: any) {
    logError('viral-sounds:unhandled', err);
    return NextResponse.json({ error: err.message || 'Error escaneando audios virales' }, { status: 500 });
  }
}
