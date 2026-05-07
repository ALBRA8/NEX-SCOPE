import { Niche, Channel, Keyword, TrendData, CategoryType } from './types';

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function generateGrowthHistory(base: number, growthRate: number): number[] {
  return months.map((_, i) => Math.round(base * Math.pow(1 + growthRate / 100, i / 12)));
}

function generateTrend(base: number, volatility: number): number[] {
  return months.map((_, i) => Math.round(base + (Math.sin(i * 0.5) * volatility) + (i * volatility * 0.3)));
}

export const niches: Niche[] = [
  {
    id: 'n1', name: 'Inteligencia Artificial & ML', category: 'Tecnología',
    nicheScore: 92, subscriberRange: '10K-100K', estimatedRPM: 12.50,
    competitionLevel: 'medio', growthRate: 45, monthlySearchVolume: 245000,
    trending: true, trendVelocity: 85, description: 'Tutoriales de IA, herramientas de ML, y aplicaciones prácticas de inteligencia artificial'
  },
  {
    id: 'n2', name: 'Finanzas Personales', category: 'Finanzas',
    nicheScore: 88, subscriberRange: '50K-500K', estimatedRPM: 18.20,
    competitionLevel: 'alto', growthRate: 28, monthlySearchVolume: 520000,
    trending: true, trendVelocity: 72, description: 'Ahorro, inversión, presupuesto y educación financiera'
  },
  {
    id: 'n3', name: 'Salud & Fitness', category: 'Salud',
    nicheScore: 85, subscriberRange: '20K-200K', estimatedRPM: 9.80,
    competitionLevel: 'alto', growthRate: 22, monthlySearchVolume: 680000,
    trending: true, trendVelocity: 65, description: 'Ejercicios, nutrición, bienestar mental y rutinas de entrenamiento'
  },
  {
    id: 'n4', name: 'Gaming Indie', category: 'Gaming',
    nicheScore: 82, subscriberRange: '5K-50K', estimatedRPM: 5.40,
    competitionLevel: 'medio', growthRate: 35, monthlySearchVolume: 180000,
    trending: true, trendVelocity: 78, description: 'Juegos independientes, reviews, gameplays y desarrollo de juegos indie'
  },
  {
    id: 'n5', name: 'Cocina Vegana', category: 'Cocina',
    nicheScore: 79, subscriberRange: '10K-80K', estimatedRPM: 7.60,
    competitionLevel: 'bajo', growthRate: 38, monthlySearchVolume: 95000,
    trending: true, trendVelocity: 88, description: 'Recetas veganas, meal prep, y lifestyle vegano'
  },
  {
    id: 'n6', name: 'Viajes Low Cost', category: 'Viajes',
    nicheScore: 77, subscriberRange: '15K-100K', estimatedRPM: 8.90,
    competitionLevel: 'medio', growthRate: 25, monthlySearchVolume: 320000,
    trending: false, trendVelocity: 55, description: 'Viajes económicos, tips de ahorro, destinos baratos y hacks de viaje'
  },
  {
    id: 'n7', name: 'Educación Online', category: 'Educación',
    nicheScore: 86, subscriberRange: '20K-300K', estimatedRPM: 11.30,
    competitionLevel: 'medio', growthRate: 32, monthlySearchVolume: 410000,
    trending: true, trendVelocity: 70, description: 'Cursos online, study tips, productividad estudiantil y e-learning'
  },
  {
    id: 'n8', name: 'Moda Sostenible', category: 'Moda',
    nicheScore: 74, subscriberRange: '5K-50K', estimatedRPM: 10.50,
    competitionLevel: 'bajo', growthRate: 42, monthlySearchVolume: 72000,
    trending: true, trendVelocity: 92, description: 'Moda eco-friendly, thrift hauls, y marcas sostenibles'
  },
  {
    id: 'n9', name: 'Criptomonedas', category: 'Finanzas',
    nicheScore: 71, subscriberRange: '50K-1M', estimatedRPM: 22.40,
    competitionLevel: 'alto', growthRate: 15, monthlySearchVolume: 890000,
    trending: false, trendVelocity: 40, description: 'Análisis crypto, trading, DeFi y noticias del mercado'
  },
  {
    id: 'n10', name: 'Productividad & Notion', category: 'Productividad',
    nicheScore: 83, subscriberRange: '10K-100K', estimatedRPM: 13.70,
    competitionLevel: 'bajo', growthRate: 40, monthlySearchVolume: 165000,
    trending: true, trendVelocity: 82, description: 'Templates Notion, sistemas de productividad, y organización personal'
  },
  {
    id: 'n11', name: 'Meditación & Mindfulness', category: 'Salud',
    nicheScore: 76, subscriberRange: '5K-50K', estimatedRPM: 8.20,
    competitionLevel: 'bajo', growthRate: 30, monthlySearchVolume: 125000,
    trending: false, trendVelocity: 60, description: 'Guías de meditación, técnicas mindfulness, y bienestar emocional'
  },
  {
    id: 'n12', name: 'True Crime en Español', category: 'Entretenimiento',
    nicheScore: 80, subscriberRange: '20K-200K', estimatedRPM: 6.80,
    competitionLevel: 'medio', growthRate: 33, monthlySearchVolume: 280000,
    trending: true, trendVelocity: 75, description: 'Casos criminales, misterios sin resolver y documentales criminales'
  },
  {
    id: 'n13', name: 'Home Improvement DIY', category: 'Arte',
    nicheScore: 73, subscriberRange: '15K-150K', estimatedRPM: 9.50,
    competitionLevel: 'medio', growthRate: 20, monthlySearchVolume: 210000,
    trending: false, trendVelocity: 48, description: 'Mejoras del hogar, bricolaje, decoración y proyectos DIY'
  },
  {
    id: 'n14', name: 'Crianza & Parenting', category: 'Educación',
    nicheScore: 70, subscriberRange: '10K-80K', estimatedRPM: 7.80,
    competitionLevel: 'medio', growthRate: 18, monthlySearchVolume: 190000,
    trending: false, trendVelocity: 42, description: 'Tips de crianza, desarrollo infantil y familia'
  },
  {
    id: 'n15', name: 'Cuidado de Mascotas', category: 'Entretenimiento',
    nicheScore: 68, subscriberRange: '5K-50K', estimatedRPM: 5.90,
    competitionLevel: 'bajo', growthRate: 25, monthlySearchVolume: 155000,
    trending: false, trendVelocity: 58, description: 'Cuidado animal, entrenamiento de mascotas y veterinaria'
  },
  {
    id: 'n16', name: 'Fotografía Digital', category: 'Arte',
    nicheScore: 72, subscriberRange: '10K-80K', estimatedRPM: 8.40,
    competitionLevel: 'medio', growthRate: 15, monthlySearchVolume: 135000,
    trending: false, trendVelocity: 35, description: 'Técnicas fotográficas, edición, equipos y composición'
  },
  {
    id: 'n17', name: 'Producción Musical', category: 'Música',
    nicheScore: 75, subscriberRange: '5K-50K', estimatedRPM: 7.20,
    competitionLevel: 'medio', growthRate: 22, monthlySearchVolume: 110000,
    trending: false, trendVelocity: 50, description: 'Beat making, mezcla, mastering y DAW tutorials'
  },
  {
    id: 'n18', name: 'Aprendizaje de Idiomas', category: 'Educación',
    nicheScore: 81, subscriberRange: '20K-200K', estimatedRPM: 10.10,
    competitionLevel: 'medio', growthRate: 28, monthlySearchVolume: 350000,
    trending: true, trendVelocity: 68, description: 'Inglés, japonés, coreano, métodos de aprendizaje y tips'
  },
  {
    id: 'n19', name: 'Tutoriales de Software', category: 'Tecnología',
    nicheScore: 84, subscriberRange: '10K-100K', estimatedRPM: 14.30,
    competitionLevel: 'medio', growthRate: 30, monthlySearchVolume: 275000,
    trending: true, trendVelocity: 73, description: 'Excel, Photoshop, Figma, WordPress y herramientas digitales'
  },
  {
    id: 'n20', name: 'Streaming Tips', category: 'Gaming',
    nicheScore: 78, subscriberRange: '5K-50K', estimatedRPM: 6.50,
    competitionLevel: 'alto', growthRate: 36, monthlySearchVolume: 195000,
    trending: true, trendVelocity: 80, description: 'OBS, setup, crecimiento en Twitch/YouTube y monetización'
  },
];

export const channels: Channel[] = [
  {
    id: 'ch1', name: 'TechIA Pro', niche: 'Inteligencia Artificial & ML',
    subscribers: 245000, totalViews: 18500000, videoCount: 312,
    avgViews: 59300, engagementRate: 6.8, uploadFrequency: '3 por semana',
    estimatedRevenue: 8500, growthHistory: generateGrowthHistory(180000, 35),
    topVideos: [
      { title: 'Las 10 Mejores Herramientas de IA en 2026', views: 1200000, engagement: 8.2 },
      { title: 'ChatGPT vs Claude: Comparativa Definitiva', views: 890000, engagement: 7.5 },
      { title: 'Cómo Ganar Dinero con IA', views: 750000, engagement: 9.1 },
      { title: 'Tutorial Completo de Midjourney', views: 620000, engagement: 6.8 },
      { title: 'IA para Automatizar tu Negocio', views: 540000, engagement: 7.2 },
    ],
    avatar: '🤖', joinDate: '2022-03-15'
  },
  {
    id: 'ch2', name: 'Finanzas Inteligentes', niche: 'Finanzas Personales',
    subscribers: 890000, totalViews: 65000000, videoCount: 456,
    avgViews: 142500, engagementRate: 5.9, uploadFrequency: '4 por semana',
    estimatedRevenue: 28000, growthHistory: generateGrowthHistory(620000, 22),
    topVideos: [
      { title: 'Cómo Ahorrar $10,000 en 6 Meses', views: 3200000, engagement: 7.8 },
      { title: 'Invertir desde Cero: Guía Completa', views: 2800000, engagement: 6.5 },
      { title: '5 Errores Financieros que Debes Evitar', views: 2100000, engagement: 8.1 },
      { title: 'Presupuesto Mensual: Mi Método', views: 1800000, engagement: 5.9 },
      { title: 'Cripto vs Acciones: Dónde Invertir', views: 1500000, engagement: 6.7 },
    ],
    avatar: '💰', joinDate: '2020-01-10'
  },
  {
    id: 'ch3', name: 'CocinaVegana+', niche: 'Cocina Vegana',
    subscribers: 72000, totalViews: 4200000, videoCount: 189,
    avgViews: 22200, engagementRate: 8.2, uploadFrequency: '2 por semana',
    estimatedRevenue: 1800, growthHistory: generateGrowthHistory(45000, 42),
    topVideos: [
      { title: 'Meal Prep Vegano para Toda la Semana', views: 380000, engagement: 9.5 },
      { title: '10 Recetas Veganas en 15 Minutos', views: 290000, engagement: 8.8 },
      { title: 'Mi Transición al Veganismo', views: 220000, engagement: 10.2 },
      { title: 'Proteína Vegana: Mitos y Realidad', views: 180000, engagement: 7.9 },
      { title: 'Despensa Vegana: Lo Imprescindible', views: 150000, engagement: 7.5 },
    ],
    avatar: '🥗', joinDate: '2023-05-20'
  },
  {
    id: 'ch4', name: 'IndieGameReview', niche: 'Gaming Indie',
    subscribers: 48000, totalViews: 3100000, videoCount: 234,
    avgViews: 13250, engagementRate: 7.5, uploadFrequency: '3 por semana',
    estimatedRevenue: 1200, growthHistory: generateGrowthHistory(30000, 38),
    topVideos: [
      { title: 'Top 20 Juegos Indie de 2026', views: 420000, engagement: 8.9 },
      { title: 'Este Juego Indie es una Obra Maestra', views: 310000, engagement: 9.2 },
      { title: 'Juegos Indie Gratuitos que Debes Probar', views: 250000, engagement: 7.8 },
      { title: 'Cómo Hacer tu Primer Juego Indie', views: 195000, engagement: 8.5 },
      { title: 'Análisis de Hollow Knight: Silksong', views: 180000, engagement: 7.1 },
    ],
    avatar: '🎮', joinDate: '2022-08-12'
  },
  {
    id: 'ch5', name: 'ProductividadPro', niche: 'Productividad & Notion',
    subscribers: 156000, totalViews: 9800000, videoCount: 198,
    avgViews: 49500, engagementRate: 7.1, uploadFrequency: '2 por semana',
    estimatedRevenue: 5200, growthHistory: generateGrowthHistory(95000, 40),
    topVideos: [
      { title: 'Mi Sistema Notion Completo 2026', views: 890000, engagement: 9.0 },
      { title: '10 Hábitos que Cambiaron Mi Vida', views: 720000, engagement: 8.3 },
      { title: 'Templates Notion Gratuitos', views: 580000, engagement: 7.8 },
      { title: 'Rutina Matutina Productiva', views: 450000, engagement: 7.5 },
      { title: 'Cómo Dejar de Procrastinar', views: 390000, engagement: 8.1 },
    ],
    avatar: '⚡', joinDate: '2022-11-03'
  },
  {
    id: 'ch6', name: 'ViajesConPoco', niche: 'Viajes Low Cost',
    subscribers: 198000, totalViews: 15200000, videoCount: 267,
    avgViews: 56900, engagementRate: 6.3, uploadFrequency: '2 por semana',
    estimatedRevenue: 4800, growthHistory: generateGrowthHistory(150000, 25),
    topVideos: [
      { title: 'Europa por $30 al Día', views: 1100000, engagement: 7.2 },
      { title: 'Hacks de Vuelos Baratos', views: 890000, engagement: 6.8 },
      { title: 'Southeast Asia con Presupuesto Mínimo', views: 750000, engagement: 7.5 },
      { title: 'Los 10 Destinos más Baratos 2026', views: 620000, engagement: 6.2 },
      { title: 'Cómo Viajar Gratis: Mis Secretos', views: 580000, engagement: 5.9 },
    ],
    avatar: '✈️', joinDate: '2021-06-18'
  },
  {
    id: 'ch7', name: 'AprendeInglésYa', niche: 'Aprendizaje de Idiomas',
    subscribers: 520000, totalViews: 38000000, videoCount: 534,
    avgViews: 71100, engagementRate: 5.4, uploadFrequency: '5 por semana',
    estimatedRevenue: 12000, growthHistory: generateGrowthHistory(400000, 20),
    topVideos: [
      { title: '100 Frases en Inglés para Sobrevivir', views: 2500000, engagement: 6.2 },
      { title: 'Inglés para Principiantes: Lección 1', views: 1900000, engagement: 5.8 },
      { title: 'Errores Comunes en Inglés', views: 1500000, engagement: 6.5 },
      { title: 'Phrasal Verbs más Usados', views: 1200000, engagement: 5.9 },
      { title: 'Inglés Americano vs Británico', views: 980000, engagement: 5.3 },
    ],
    avatar: '🌍', joinDate: '2019-09-22'
  },
  {
    id: 'ch8', name: 'ModaEco', niche: 'Moda Sostenible',
    subscribers: 35000, totalViews: 1800000, videoCount: 145,
    avgViews: 12400, engagementRate: 9.1, uploadFrequency: '1 por semana',
    estimatedRevenue: 900, growthHistory: generateGrowthHistory(18000, 45),
    topVideos: [
      { title: 'Thrift Haul: $100 para todo el Mes', views: 210000, engagement: 10.5 },
      { title: 'Marcas Sostenibles que Debes Conocer', views: 165000, engagement: 9.8 },
      { title: 'Cómo Construir un Armario Cápsula', views: 140000, engagement: 9.2 },
      { title: 'DIY: Transforma tu Ropa Vieja', views: 120000, engagement: 8.7 },
      { title: 'Moda Rápida: El Costo Real', views: 98000, engagement: 9.5 },
    ],
    avatar: '🌿', joinDate: '2023-02-14'
  },
  {
    id: 'ch9', name: 'TrueCrimeES', niche: 'True Crime en Español',
    subscribers: 380000, totalViews: 28000000, videoCount: 178,
    avgViews: 157300, engagementRate: 7.8, uploadFrequency: '1 por semana',
    estimatedRevenue: 8900, growthHistory: generateGrowthHistory(280000, 28),
    topVideos: [
      { title: 'El Caso que Conmocionó a España', views: 3200000, engagement: 9.5 },
      { title: 'Misterios Sin Resolver: Desapariciones', views: 2500000, engagement: 8.8 },
      { title: 'Asesinos en Serie: Perfil Psicológico', views: 1900000, engagement: 7.9 },
      { title: 'Casos Cerrados que Deberían Reabrirse', views: 1600000, engagement: 8.2 },
      { title: 'Crímenes que Cambiaron Leyes', views: 1400000, engagement: 7.5 },
    ],
    avatar: '🔍', joinDate: '2021-10-01'
  },
  {
    id: 'ch10', name: 'SoftwareMaster', niche: 'Tutoriales de Software',
    subscribers: 178000, totalViews: 12500000, videoCount: 312,
    avgViews: 40060, engagementRate: 6.2, uploadFrequency: '3 por semana',
    estimatedRevenue: 6800, growthHistory: generateGrowthHistory(130000, 30),
    topVideos: [
      { title: 'Excel Avanzado: Tutorial Completo', views: 980000, engagement: 7.1 },
      { title: 'Figma para Principiantes', views: 760000, engagement: 6.5 },
      { title: 'Photoshop 2026: Novedades', views: 620000, engagement: 6.8 },
      { title: 'WordPress de Cero a Experto', views: 540000, engagement: 5.9 },
      { title: 'Automatización con Zapier', views: 430000, engagement: 6.2 },
    ],
    avatar: '💻', joinDate: '2021-04-08'
  },
  {
    id: 'ch11', name: 'FitLife ES', niche: 'Salud & Fitness',
    subscribers: 650000, totalViews: 48000000, videoCount: 389,
    avgViews: 123400, engagementRate: 5.8, uploadFrequency: '4 por semana',
    estimatedRevenue: 15000, growthHistory: generateGrowthHistory(500000, 20),
    topVideos: [
      { title: 'Rutina Full Body sin Equipamiento', views: 2800000, engagement: 6.9 },
      { title: 'Dieta para Perder Grasa: Guía Científica', views: 2200000, engagement: 6.2 },
      { title: '30 Días de Reto Fitness', views: 1800000, engagement: 7.5 },
      { title: 'Yoga para Principiantes', views: 1500000, engagement: 5.8 },
      { title: 'Mitos de la Nutrición Deportiva', views: 1200000, engagement: 6.1 },
    ],
    avatar: '💪', joinDate: '2020-07-15'
  },
  {
    id: 'ch12', name: 'CryptoAnálisis', niche: 'Criptomonedas',
    subscribers: 420000, totalViews: 31000000, videoCount: 567,
    avgViews: 54670, engagementRate: 4.8, uploadFrequency: '7 por semana',
    estimatedRevenue: 22000, growthHistory: generateGrowthHistory(380000, 12),
    topVideos: [
      { title: 'Bitcoin 2026: Predicciones', views: 1800000, engagement: 5.5 },
      { title: 'Altcoins que Explotarán este Año', views: 1500000, engagement: 5.2 },
      { title: 'DeFi: Guía para Principiantes', views: 1100000, engagement: 4.9 },
      { title: 'Trading Crypto: Estrategias', views: 950000, engagement: 4.5 },
      { title: 'NFTs: Todavía Vale la Pena?', views: 820000, engagement: 4.1 },
    ],
    avatar: '₿', joinDate: '2020-03-20'
  },
  {
    id: 'ch13', name: 'MeditaciónGuiada', niche: 'Meditación & Mindfulness',
    subscribers: 88000, totalViews: 6500000, videoCount: 234,
    avgViews: 27780, engagementRate: 8.9, uploadFrequency: '3 por semana',
    estimatedRevenue: 2400, growthHistory: generateGrowthHistory(60000, 30),
    topVideos: [
      { title: 'Meditación de 10 Minutos para Dormir', views: 520000, engagement: 10.2 },
      { title: 'Reduce la Ansiedad en 5 Minutos', views: 410000, engagement: 9.8 },
      { title: 'Mindfulness para Principiantes', views: 350000, engagement: 9.1 },
      { title: 'Meditación Matutina: Comienza el Día', views: 280000, engagement: 8.5 },
      { title: 'Técnicas de Respiración', views: 230000, engagement: 8.8 },
    ],
    avatar: '🧘', joinDate: '2022-01-05'
  },
  {
    id: 'ch14', name: 'DIYHogar', niche: 'Home Improvement DIY',
    subscribers: 145000, totalViews: 11200000, videoCount: 198,
    avgViews: 56560, engagementRate: 6.5, uploadFrequency: '2 por semana',
    estimatedRevenue: 4500, growthHistory: generateGrowthHistory(115000, 18),
    topVideos: [
      { title: 'Renueva tu Baño por Menos de $500', views: 780000, engagement: 7.2 },
      { title: '15 Proyectos DIY para el Fin de Semana', views: 620000, engagement: 6.8 },
      { title: 'Organización del Hogar: Ideas Geniales', views: 540000, engagement: 6.5 },
      { title: 'Cómo Pintar como un Profesional', views: 450000, engagement: 6.1 },
      { title: 'Jardín en Espacios Pequeños', views: 380000, engagement: 6.9 },
    ],
    avatar: '🏠', joinDate: '2021-09-12'
  },
  {
    id: 'ch15', name: 'BeatsMaker', niche: 'Producción Musical',
    subscribers: 62000, totalViews: 3800000, videoCount: 167,
    avgViews: 22750, engagementRate: 7.8, uploadFrequency: '2 por semana',
    estimatedRevenue: 1600, growthHistory: generateGrowthHistory(42000, 22),
    topVideos: [
      { title: 'Haz un Beat en 10 Minutos', views: 340000, engagement: 8.5 },
      { title: 'FL Studio: Tutorial Completo', views: 280000, engagement: 7.9 },
      { title: 'Mezcla y Master: Tips Pro', views: 220000, engagement: 7.6 },
      { title: 'Los Mejores VST Gratuitos', views: 190000, engagement: 8.1 },
      { title: 'Cómo Vender tus Beats Online', views: 160000, engagement: 7.4 },
    ],
    avatar: '🎵', joinDate: '2022-06-28'
  },
];

export const keywords: Keyword[] = [
  { id: 'kw1', keyword: 'inteligencia artificial', volume: 245000, competition: 72, cpc: 2.80, trend: generateTrend(180000, 15000), relatedKeywords: ['machine learning', 'deep learning', 'chatgpt', 'ia generativa', 'redes neuronales'] },
  { id: 'kw2', keyword: 'finanzas personales', volume: 520000, competition: 85, cpc: 4.50, trend: generateTrend(420000, 20000), relatedKeywords: ['ahorro', 'inversión', 'presupuesto', 'dinero extra', 'libertad financiera'] },
  { id: 'kw3', keyword: 'rutina de ejercicios', volume: 680000, competition: 78, cpc: 1.90, trend: generateTrend(550000, 25000), relatedKeywords: ['entrenamiento', 'gym', 'cardio', 'pesas', 'calistenia'] },
  { id: 'kw4', keyword: 'juegos indie', volume: 180000, competition: 55, cpc: 1.20, trend: generateTrend(120000, 12000), relatedKeywords: ['gaming', 'indie games', 'steam', 'gameplay', 'review'] },
  { id: 'kw5', keyword: 'recetas veganas', volume: 95000, competition: 42, cpc: 1.60, trend: generateTrend(65000, 8000), relatedKeywords: ['cocina vegana', 'meal prep vegano', 'proteína vegetal', 'comida saludable'] },
  { id: 'kw6', keyword: 'viajes baratos', volume: 320000, competition: 68, cpc: 2.10, trend: generateTrend(280000, 15000), relatedKeywords: ['vuelos baratos', 'turismo low cost', 'backpacking', 'ofertas viajes'] },
  { id: 'kw7', keyword: 'cursos online gratis', volume: 410000, competition: 80, cpc: 3.20, trend: generateTrend(350000, 18000), relatedKeywords: ['e-learning', 'formación online', 'udemy', 'coursera', 'certificaciones'] },
  { id: 'kw8', keyword: 'moda sostenible', volume: 72000, competition: 35, cpc: 2.30, trend: generateTrend(40000, 7000), relatedKeywords: ['slow fashion', 'eco moda', 'thrift', 'armario cápsula', 'marca ética'] },
  { id: 'kw9', keyword: 'criptomonedas', volume: 890000, competition: 90, cpc: 5.80, trend: generateTrend(750000, 40000), relatedKeywords: ['bitcoin', 'ethereum', 'trading crypto', 'defi', 'nft'] },
  { id: 'kw10', keyword: 'notion templates', volume: 165000, competition: 48, cpc: 2.90, trend: generateTrend(100000, 12000), relatedKeywords: ['productividad', 'notion gratis', 'organización', 'planificador', 'sistema'] },
  { id: 'kw11', keyword: 'meditación guiada', volume: 125000, competition: 45, cpc: 1.40, trend: generateTrend(90000, 8000), relatedKeywords: ['mindfulness', 'relajación', 'ansiedad', 'respiración', 'bienestar'] },
  { id: 'kw12', keyword: 'true crime español', volume: 280000, competition: 62, cpc: 1.80, trend: generateTrend(200000, 15000), relatedKeywords: ['crímenes', 'misterio', 'asesinatos', 'investigación', 'documental'] },
  { id: 'kw13', keyword: 'bricolaje hogar', volume: 210000, competition: 58, cpc: 2.00, trend: generateTrend(180000, 10000), relatedKeywords: ['DIY', 'restauración', 'decoración', 'manualidades', 'reformas'] },
  { id: 'kw14', keyword: 'aprender inglés', volume: 350000, competition: 82, cpc: 3.50, trend: generateTrend(300000, 15000), relatedKeywords: ['inglés gratis', 'IELTS', 'TOEFL', 'speaking', 'vocabulario'] },
  { id: 'kw15', keyword: 'tutorial photoshop', volume: 275000, competition: 75, cpc: 2.70, trend: generateTrend(220000, 12000), relatedKeywords: ['edición fotos', 'diseño gráfico', 'adobe', 'manipulación', 'retoque'] },
  { id: 'kw16', keyword: 'streaming tips', volume: 195000, competition: 65, cpc: 1.90, trend: generateTrend(130000, 14000), relatedKeywords: ['twitch', 'OBS', 'setup streaming', 'monetización', 'crecimiento'] },
  { id: 'kw17', keyword: 'machine learning tutorial', volume: 155000, competition: 70, cpc: 4.20, trend: generateTrend(110000, 11000), relatedKeywords: ['python', 'tensorflow', 'data science', 'algoritmos', 'modelo'] },
  { id: 'kw18', keyword: 'presupuesto mensual', volume: 180000, competition: 55, cpc: 3.10, trend: generateTrend(150000, 8000), relatedKeywords: ['excel presupuesto', 'ahorro mensual', 'gastos', 'finanzas', 'control'] },
  { id: 'kw19', keyword: 'ejercicios en casa', volume: 420000, competition: 72, cpc: 1.50, trend: generateTrend(350000, 18000), relatedKeywords: ['sin equipamiento', 'calistenia', 'HIIT', 'rutina casera', 'fitness'] },
  { id: 'kw20', keyword: 'desarrollo personal', volume: 290000, competition: 65, cpc: 2.40, trend: generateTrend(240000, 12000), relatedKeywords: ['crecimiento', 'motivación', 'hábitos', 'meta', 'éxito'] },
  { id: 'kw21', keyword: 'review tecnología', volume: 310000, competition: 78, cpc: 3.80, trend: generateTrend(260000, 14000), relatedKeywords: ['gadgets', 'smartphone', 'laptop', 'unboxing', 'comparativa'] },
  { id: 'kw22', keyword: 'cocina fácil y rápida', volume: 380000, competition: 70, cpc: 1.70, trend: generateTrend(320000, 16000), relatedKeywords: ['recetas fáciles', 'comida rápida', 'meal prep', 'cocinar en casa'] },
  { id: 'kw23', keyword: 'youtube seo', volume: 85000, competition: 52, cpc: 3.60, trend: generateTrend(55000, 7000), relatedKeywords: ['crecimiento youtube', 'algoritmo', 'tags', 'thumbnails', 'viral'] },
  { id: 'kw24', keyword: 'inversiones para principiantes', volume: 240000, competition: 68, cpc: 5.20, trend: generateTrend(180000, 13000), relatedKeywords: ['bolsa', 'ETF', 'dividendos', 'portfolio', 'riesgo'] },
  { id: 'kw25', keyword: 'automatización con IA', volume: 98000, competition: 40, cpc: 3.90, trend: generateTrend(55000, 9000), relatedKeywords: ['zapier', 'make', 'chatgpt api', 'workflows', 'no-code'] },
  { id: 'kw26', keyword: 'yoga para principiantes', volume: 260000, competition: 62, cpc: 1.60, trend: generateTrend(220000, 10000), relatedKeywords: ['asanas', 'flexibilidad', 'relajación', 'pranayama', 'mindfulness'] },
  { id: 'kw27', keyword: 'gaming setup', volume: 175000, competition: 70, cpc: 2.50, trend: generateTrend(130000, 11000), relatedKeywords: ['PC gaming', 'periféricos', 'monitor', 'silla gamer', 'escritorio'] },
  { id: 'kw28', keyword: 'emprendimiento digital', volume: 200000, competition: 60, cpc: 3.40, trend: generateTrend(160000, 12000), relatedKeywords: ['negocio online', 'freelance', 'passive income', 'side hustle', 'marketing digital'] },
  { id: 'kw29', keyword: 'fotografía de producto', volume: 88000, competition: 48, cpc: 2.80, trend: generateTrend(70000, 6000), relatedKeywords: ['producto', 'e-commerce', 'iluminación', 'edición', 'amazon listing'] },
  { id: 'kw30', keyword: 'desarrollo web 2026', volume: 145000, competition: 72, cpc: 4.10, trend: generateTrend(110000, 10000), relatedKeywords: ['react', 'nextjs', 'frontend', 'backend', 'fullstack'] },
];

export const trendData: TrendData[] = months.map((month, i) => ({
  month,
  'Tecnología': Math.round(100 + i * 12 + Math.sin(i) * 20),
  'Finanzas': Math.round(85 + i * 8 + Math.sin(i * 0.8) * 15),
  'Salud': Math.round(90 + i * 7 + Math.sin(i * 0.6) * 12),
  'Gaming': Math.round(75 + i * 10 + Math.sin(i * 1.2) * 18),
  'Educación': Math.round(80 + i * 9 + Math.sin(i * 0.9) * 14),
  'Cocina': Math.round(60 + i * 6 + Math.sin(i * 0.7) * 10),
}));

export const revenueData = [
  { name: 'Anuncios', value: 45, color: '#10b981' },
  { name: 'Patrocinios', value: 30, color: '#f59e0b' },
  { name: 'Afiliados', value: 15, color: '#8b5cf6' },
  { name: 'Membresías', value: 10, color: '#06b6d4' },
];

export const rpmByNiche = [
  { niche: 'Criptomonedas', rpm: 22.40 },
  { niche: 'Finanzas Personales', rpm: 18.20 },
  { niche: 'Tutoriales Software', rpm: 14.30 },
  { niche: 'Productividad', rpm: 13.70 },
  { niche: 'IA & Machine Learning', rpm: 12.50 },
  { niche: 'Educación Online', rpm: 11.30 },
  { niche: 'Moda Sostenible', rpm: 10.50 },
  { niche: 'Viajes Low Cost', rpm: 8.90 },
  { niche: 'Home Improvement', rpm: 9.50 },
  { niche: 'Salud & Fitness', rpm: 9.80 },
];

export const categories: CategoryType[] = [
  'Tecnología', 'Finanzas', 'Salud', 'Entretenimiento',
  'Educación', 'Gaming', 'Cocina', 'Viajes', 'Moda',
  'Productividad', 'Arte', 'Música'
];
