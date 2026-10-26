import { NextResponse } from 'next/server';

export interface AffiliateOffer {
  id: string;
  title: string;
  network: 'JVZoo' | 'ClickBank' | 'Hotmart' | 'Digistore24';
  niche: string;
  price: string;
  payout_avg: string;
  commission_pct: number;
  gravity_score: number;
  units_sold: number;
  epc: string;
  vendor: string;
  affiliate_page_url: string;
  sales_page_url: string;
  target_rpm: number;
  hook: string;
  angles: string[];
  product_summary: string;
}

export const TOP_AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: 'jvz-446851',
    title: 'Adastra Studio Bundle — Suite Todo-en-Uno de Producción de Video IA',
    network: 'JVZoo',
    niche: 'AI & Software',
    price: '$67.00',
    payout_avg: '$187.50',
    commission_pct: 50,
    gravity_score: 168.4,
    units_sold: 5200,
    epc: '$4.12',
    vendor: 'Adastra AI Labs',
    affiliate_page_url: 'https://www.jvzoo.com/c/1/446851?tid=topseller',
    sales_page_url: 'https://www.jvzoo.com/c/1/446851?tid=topseller',
    target_rpm: 28.5,
    hook: '¿De verdad puedes reemplazar un equipo de edición de $3,000 con este bundle de $67? Puse a prueba Adastra Studio y esto fue lo que pasó.',
    angles: [
      'Comparativa directa contra Premiere Pro y CapCut Desktop',
      'Flujo de trabajo de 0 a video terminado en 12 minutos',
      'Desglose del embudo de ventas y OTOs para maximizar ROI',
    ],
    product_summary: 'Suite completa de creación y edición audiovisual con avatares IA, clonación de voz y transiciones automáticas sin suscripción mensual.',
  },
  {
    id: 'jvz-442785',
    title: 'ViralRevenueAI — Automatización de Canales Faceless y Monetización Rápida',
    network: 'JVZoo',
    niche: 'E-Commerce & Marketing',
    price: '$47.00',
    payout_avg: '$145.00',
    commission_pct: 50,
    gravity_score: 142.2,
    units_sold: 4100,
    epc: '$3.85',
    vendor: 'RevenueEngine AI',
    affiliate_page_url: 'https://www.jvzoo.com/c/1/442785?tid=topseller',
    sales_page_url: 'https://www.jvzoo.com/c/1/442785?tid=topseller',
    target_rpm: 32.0,
    hook: 'El 90% de los canales sin rostro fracasan en 30 días porque eligen mal su nicho. ViralRevenueAI promete resolver esto en 1 clic.',
    angles: [
      'Auditoría en vivo de nichos de alto RPM recomendados por la herramienta',
      'Cálculo de ingresos pasivos reales vs exageraciones publicitarias',
      'Plantilla paso a paso para monetizar antes de los 1,000 suscriptores',
    ],
    product_summary: 'Herramienta de investigación y generación de scripts orientada a canales sin rostro de YouTube y TikTok para acelerar ventas de afiliados.',
  },
  {
    id: 'jvz-436239',
    title: 'Spark AI Video Creator — Generador Ultrarrápido de Shorts y Reels Virales',
    network: 'JVZoo',
    niche: 'AI & Software',
    price: '$37.00',
    payout_avg: '$98.00',
    commission_pct: 50,
    gravity_score: 125.7,
    units_sold: 3850,
    epc: '$3.20',
    vendor: 'SparkTech Media',
    affiliate_page_url: 'https://www.jvzoo.com/affiliate/affiliateinfonew/index/436239',
    sales_page_url: 'https://www.jvzoo.com/affiliate/affiliateinfonew/index/436239',
    target_rpm: 24.0,
    hook: 'Creé 30 Shorts virales en menos de 10 minutos con Spark AI. ¿Algoritmo aprobado o spam flaggeado?',
    angles: [
      'Reto contra el reloj: crear un video completo en 60 segundos',
      'Análisis de retención segundo a segundo de los videos producidos',
      'Estrategia de repurposing de podcasts a micro-contenido',
    ],
    product_summary: 'Generador de micro-videos verticales 9:16 con subtítulos dinámicos estilo Hormozi, B-roll inteligente y efectos de sonido automáticos.',
  },
  {
    id: 'jvz-434893',
    title: 'AiVideoStitcherFX — Empalmador y Enlazador Automático de Clips B-Roll',
    network: 'JVZoo',
    niche: 'AI & Software',
    price: '$37.00',
    payout_avg: '$112.00',
    commission_pct: 50,
    gravity_score: 118.0,
    units_sold: 2900,
    epc: '$2.95',
    vendor: 'VideoFX Pros',
    affiliate_page_url: 'https://www.jvzoo.com/b/115739/434893/5',
    sales_page_url: 'https://www.jvzoo.com/b/115739/434893/5',
    target_rpm: 26.5,
    hook: 'Si tardas más de 1 hora pegando clips de B-Roll y sincronizando música de fondo, estás perdiendo el 80% de tu tiempo.',
    angles: [
      'Cómo pasar de un guion de texto crudo a una línea de tiempo lista',
      'Integración con bibliotecas de stock libres de derechos',
      'Ahorro de costos: comparativa contra pagarle a un editor freelance',
    ],
    product_summary: 'Software de automatización que cose secuencias de video, detecta pausas de voz y coloca transiciones cinemáticas automáticamente.',
  },
  {
    id: 'jvz-424623',
    title: 'Cinematic Maker AI — Creador de Trailers y Video Sales Letters (VSL)',
    network: 'JVZoo',
    niche: 'AI & Software',
    price: '$47.00',
    payout_avg: '$165.00',
    commission_pct: 50,
    gravity_score: 154.6,
    units_sold: 4900,
    epc: '$3.90',
    vendor: 'Cinematic Systems',
    affiliate_page_url: 'https://www.jvzoo.com/b/114547/424623/2',
    sales_page_url: 'https://www.jvzoo.com/b/114547/424623/2',
    target_rpm: 34.0,
    hook: 'Las VSL tradicionales ya no convierten como antes. Probé el nuevo formato cinemático con IA que duplicó la tasa de compra.',
    angles: [
      'Estructura psicológica del gancho de los primeros 10 segundos en una VSL',
      'Muestrario de voces con entonación emocional ultra-realista',
      'Desglose paso a paso de la página de captura y oferta irresistible',
    ],
    product_summary: 'Motor de renderizado cinemático enfocado en video cartas de venta, trailers de lanzamiento de cursos y promociones SaaS.',
  },
  {
    id: 'jvz-434679',
    title: 'Synthesys Actors — Avatares Hiperrealistas con Sincronización Labial',
    network: 'JVZoo',
    niche: 'AI & Software',
    price: '$67.00',
    payout_avg: '$210.00',
    commission_pct: 50,
    gravity_score: 178.9,
    units_sold: 6300,
    epc: '$4.50',
    vendor: 'Synthesys Global',
    affiliate_page_url: 'https://www.jvzoo.com/b/115745/434679/4',
    sales_page_url: 'https://www.jvzoo.com/b/115745/434679/4',
    target_rpm: 36.5,
    hook: '¿Es este presentador una persona real o un avatar de Inteligencia Artificial? El 94% de la gente no logra notar la diferencia.',
    angles: [
      'Test ciego: humano real vs avatar de Synthesys Actors',
      'Cómo crear contenido para marcas sin mostrar nunca tu propio rostro',
      'Generación de videos multilingües con el mismo rostro y labios coordinados',
    ],
    product_summary: 'Biblioteca de actores digitales 4K con sincronización labial precisa en más de 40 idiomas, ideal para formación, soporte y videos comerciales.',
  },
  {
    id: 'cb-wealthdna',
    title: 'Wealth DNA Code — Activador de Ondas Theta y Reprogramación Mental',
    network: 'ClickBank',
    niche: 'Desarrollo Personal',
    price: '$39.00',
    payout_avg: '$56.40',
    commission_pct: 75,
    gravity_score: 195.2,
    units_sold: 12500,
    epc: '$3.10',
    vendor: 'Alex Maxwell',
    affiliate_page_url: 'https://hop.clickbank.net/?affiliate=aff&vendor=wealthdna',
    sales_page_url: 'https://wealthdnacode.com',
    target_rpm: 21.0,
    hook: '¿Por qué la ciencia de los chakras y la física cuántica están generando tanto debate en Silicon Valley? Analizo este controversial audio.',
    angles: [
      'Experimento de 7 días escuchando las frecuencias antes de dormir',
      'Desmitificación de afirmaciones esotéricas vs efectos placebo comprobados',
      'Por qué las ofertas de mentalidad tienen una retención de audiencia tan masiva',
    ],
    product_summary: 'Pistas de audio binaurales de 7 minutos diseñadas para alinear centros energéticos y disipar bloqueos mentales sobre el dinero.',
  },
  {
    id: 'hot-metodo-dropshipping',
    title: 'Máster Dropshipping & IA 2026 — De Cero a $10K con Proveedores Locales',
    network: 'Hotmart',
    niche: 'E-Commerce & Marketing',
    price: '$97.00',
    payout_avg: '$67.90',
    commission_pct: 70,
    gravity_score: 135.0,
    units_sold: 3400,
    epc: '$4.80',
    vendor: 'EcomAcademy Pro',
    affiliate_page_url: 'https://hotmart.com/es/marketplace/productos/dropshipping-ia-2026',
    sales_page_url: 'https://hotmart.com/es/marketplace/productos/dropshipping-ia-2026',
    target_rpm: 29.0,
    hook: 'El Dropshipping con China está muerto por los tiempos de envío. Esta es la nueva estrategia con bodegas locales que factura 4 cifras semanales.',
    angles: [
      'Estudio de caso real: cómo encontrar proveedores locales con Dropi y Cazador',
      'Creación de tienda Shopify en 30 minutos sin inventario previo',
      'Estrategia de tráfico pagado en TikTok Ads con creativos de IA',
    ],
    product_summary: 'Formación profesional paso a paso sobre dropshipping contra-entrega y comercio electrónico automatizado en mercados hispanos.',
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const network = searchParams.get('network');
  const niche = searchParams.get('niche');
  const search = searchParams.get('search')?.toLowerCase();
  const sortBy = searchParams.get('sort') || 'gravity';

  let filtered = [...TOP_AFFILIATE_OFFERS];

  if (network && network !== 'all') {
    filtered = filtered.filter((o) => o.network.toLowerCase() === network.toLowerCase());
  }

  if (niche && niche !== 'all') {
    filtered = filtered.filter((o) => o.niche.toLowerCase() === niche.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(
      (o) =>
        o.title.toLowerCase().includes(search) ||
        o.vendor.toLowerCase().includes(search) ||
        o.product_summary.toLowerCase().includes(search) ||
        o.hook.toLowerCase().includes(search)
    );
  }

  if (sortBy === 'gravity') {
    filtered.sort((a, b) => b.gravity_score - a.gravity_score);
  } else if (sortBy === 'payout') {
    filtered.sort((a, b) => {
      const pa = parseFloat(a.payout_avg.replace(/[^0-9.]/g, '')) || 0;
      const pb = parseFloat(b.payout_avg.replace(/[^0-9.]/g, '')) || 0;
      return pb - pa;
    });
  } else if (sortBy === 'commission') {
    filtered.sort((a, b) => b.commission_pct - a.commission_pct);
  } else if (sortBy === 'sales') {
    filtered.sort((a, b) => b.units_sold - a.units_sold);
  }

  return NextResponse.json({
    status: 'ok',
    total: filtered.length,
    offers: filtered,
    stats: {
      avg_gravity: (filtered.reduce((acc, o) => acc + o.gravity_score, 0) / (filtered.length || 1)).toFixed(1),
      avg_commission: `${Math.round(filtered.reduce((acc, o) => acc + o.commission_pct, 0) / (filtered.length || 1))}%`,
      max_payout: '$' + Math.max(...filtered.map((o) => parseFloat(o.payout_avg.replace(/[^0-9.]/g, '')) || 0)).toFixed(2),
    },
  });
}
