import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { extractJson } from '@/lib/extract-json';
import { getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/errors';

export interface WinningProduct {
  id: string;
  name: string;
  category: string;
  velocity: string;
  price: string;
  profit_margin: string;
  saturation: 'Baja' | 'Media' | 'Alta';
  viral_hook: string;
  audience: string;
  source_url: string;
  image_url?: string;
  selling_points: string[];
}

function getFallbackProducts(category: string): WinningProduct[] {
  return [
    {
      id: 'prod_1',
      name: 'Cafetera Espresso Portátil Eléctrica OutIn',
      category: 'Cocina & Gadgets',
      velocity: '+380% esta semana',
      price: '$64.99',
      profit_margin: '62% (~$40 ganancia/ud)',
      saturation: 'Baja',
      viral_hook: '¡Deja de gastar $5 todos los días en Starbucks! Esta mini máquina prepara espresso en 3 minutos.',
      audience: 'Viajeros, oficinistas, amantes del café y campistas',
      source_url: 'https://amazon.com/dp/B0B5KW9XYZ',
      selling_points: ['Batería recargable USB-C', 'Presión de 20 bares', 'Ligera y cabe en la mochila'],
    },
    {
      id: 'prod_2',
      name: 'Corrector de Postura Inteligente con Vibración',
      category: 'Salud & Bienestar',
      velocity: '+290% en 14 días',
      price: '$24.90',
      profit_margin: '70% (~$17 ganancia/ud)',
      saturation: 'Media',
      viral_hook: 'Si trabajas más de 6 horas frente al computador, tu espalda te va a agradecer ver esto.',
      audience: 'Personas con trabajo sedentario, oficinistas y estudiantes',
      source_url: 'https://amazon.com/dp/B08XYZ1234',
      selling_points: ['Sensor de ángulo de 25 grados', 'Aviso discreto por vibración', 'Batería de larga duración'],
    },
    {
      id: 'prod_3',
      name: 'Pistola Masajeadora Muscular Térmica Mini',
      category: 'Fitness & Recuperación',
      velocity: '+420% en 7 días',
      price: '$39.99',
      profit_margin: '58% (~$23 ganancia/ud)',
      saturation: 'Baja',
      viral_hook: 'El secreto que los fisioterapeutas usan para aliviar dolores musculares en 60 segundos.',
      audience: 'Gimnasio, corredores, personas con dolor cervical o lumbar',
      source_url: 'https://amazon.com/dp/B09ABC5678',
      selling_points: ['Cabezal térmico con calor infrarrojo', 'Tamaño de bolsillo ultra silencioso', '4 velocidades de percusión'],
    },
    {
      id: 'prod_4',
      name: 'Sellador y Cortador de Bolsas Térmico Magnético',
      category: 'Hogar & Cocina',
      velocity: '+195% esta semana',
      price: '$14.99',
      profit_margin: '75% (~$11 ganancia/ud)',
      saturation: 'Media',
      viral_hook: 'El error que arruina tus snacks y comida abierta. Este pequeño imán de nevera lo soluciona.',
      audience: 'Amas de casa, familias, amantes de los snacks crujientes',
      source_url: 'https://amazon.com/dp/B07TEST890',
      selling_points: ['Se pega al refrigerador con imán', 'Recargable por USB', 'Sella herméticamente en 1 segundo'],
    },
    {
      id: 'prod_5',
      name: 'Aspiradora y Compresor de Mano Inalámbrico para Auto',
      category: 'Auto & Accesorios',
      velocity: '+510% este mes',
      price: '$45.00',
      profit_margin: '64% (~$28 ganancia/ud)',
      saturation: 'Baja',
      viral_hook: '¿Por qué pagar $15 en el autolavado cuando puedes tener tu carro impecable en 5 minutos?',
      audience: 'Conductores de Uber, amantes de los autos limpios y familias',
      source_url: 'https://amazon.com/dp/B0AUTO9988',
      selling_points: ['Potencia de succión 12000Pa', 'Función 2 en 1: aspira e infla llantas', 'Filtro HEPA lavable'],
    },
  ];
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  try {
    const body = await req.json().catch(() => ({}));
    const category = String(body.category || 'Todas').trim();

    try {
      const zai = await ZAI.create();
      const prompt = `Actúa como un Experto en E-Commerce y Dropshipping Scout de TikTok Shop y Amazon Movers & Shakers.
Analiza productos que actualmente están explotando en ventas y demanda para la categoría "${category}".
Devuelve entre 4 y 6 productos ganadores con alta velocidad de venta, márgenes de ganancia atractivos y ganchos virales para videos cortos 9:16.

Responde ÚNICAMENTE en JSON con esta estructura:
{
  "products": [
    {
      "id": "prod_1",
      "name": "Nombre completo del producto",
      "category": "Categoría",
      "velocity": "+350% esta semana",
      "price": "$34.99",
      "profit_margin": "65% ($22 ganancia)",
      "saturation": "Baja",
      "viral_hook": "Gancho viral para abrir el video en los primeros 3 segundos",
      "audience": "Público objetivo ideal",
      "source_url": "https://amazon.com",
      "selling_points": ["Beneficio 1", "Beneficio 2", "Beneficio 3"]
    }
  ]
}
Valores de saturation permitidos: 'Baja' | 'Media' | 'Alta'.`;

      const aiRes = await zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = aiRes.choices[0]?.message?.content || '';
      const parsed = extractJson(raw);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return NextResponse.json({ ok: true, source: 'ai_scout', products: parsed.products });
      }
    } catch (aiErr) {
      logError('winning-products:ai-error', aiErr);
    }

    const fallback = getFallbackProducts(category);
    return NextResponse.json({ ok: true, source: 'fallback_scout', products: fallback });
  } catch (err: any) {
    logError('winning-products:unhandled', err);
    return NextResponse.json({ error: err.message || 'Error escaneando productos' }, { status: 500 });
  }
}
