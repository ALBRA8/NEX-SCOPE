'use client';

import { useState } from 'react';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, Calculator, BarChart3, Loader2, AlertCircle,
  TrendingUp, Sparkles, ArrowRight, ShieldCheck, Zap, Rocket, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RPMTierCategory, NichePivotSuggestion } from '@/lib/types';
import { ExportToAutomationButton } from '@/components/shared/ExportToAutomationButton';

interface MonetizationData {
  rpm: number;
  cpm: number;
  monthlyRevenue: number;
  annualRevenue: number;
  rpmByNiche: { niche: string; rpm: number }[];
  revenueBreakdown: { name: string; value: number; color: string }[];
}

const RPM_TIERS_CATALOG: RPMTierCategory[] = [
  {
    tier: 'Tier 1',
    rpmRange: '$15 - $45+ RPM',
    minRpm: 15,
    maxRpm: 45,
    niches: ['Finanzas Personales e Inversión', 'SaaS y Software B2B', 'Bienes Raíces y Real Estate', 'Inteligencia Artificial y Automatización', 'Trading y Cripto'],
    description: 'Anunciantes corporativos con presupuestos masivos de adquisición de clientes de alto valor (LTV).',
    advertisers: 'Bancos, Brokers, Empresas de Software empresarial, Inmobiliarias.',
  },
  {
    tier: 'Tier 2',
    rpmRange: '$6 - $14 RPM',
    minRpm: 6,
    maxRpm: 14,
    niches: ['Productividad y Desarrollo Personal', 'Salud, Fitness y Nutrición', 'Misterios, Ciencia y Curiosidades Profundas', 'Educación y Carreras Tech'],
    description: 'Excelente equilibrio entre volumen masivo de visitas y anunciantes de productos de consumo y cursos.',
    advertisers: 'Suplementos, Apps de productividad, Plataformas de cursos online, Hardware.',
  },
  {
    tier: 'Tier 3',
    rpmRange: '$2 - $5 RPM',
    minRpm: 2,
    maxRpm: 5,
    niches: ['Gaming y Videojuegos', 'Humor y Memes', 'Curiosidades Virales Rápidas', 'Vlogs y Entretenimiento General'],
    description: 'Audiencia masiva pero con anunciantes de bajo presupuesto por clic (anuncios programáticos masivos).',
    advertisers: 'Juegos móviles, Bebidas energéticas, E-commerce de bajo coste.',
  },
];

export function MonetizationView() {
  const [niche, setNiche] = useState('');
  const [subscribers, setSubscribers] = useState([50000]);
  const [viewsPerMonth, setViewsPerMonth] = useState([200000]);
  const [data, setData] = useState<MonetizationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { status: aiStatus, check: recheckAI } = useAIStatus();

  // Motor de Pivote hacia Alto RPM
  const [pivotTopic, setPivotTopic] = useState('');
  const [pivots, setPivots] = useState<NichePivotSuggestion[]>([]);

  const handleCalculate = async () => {
    const safeNiche = niche.trim();
    if (!safeNiche) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/monetization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: safeNiche, subscribers: subscribers[0], viewsPerMonth: viewsPerMonth[0] }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d?.error || 'Error al calcular.');
        return;
      }
      setData(d);
    } catch (err: any) {
      setError(err?.message || 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePivots = () => {
    const raw = pivotTopic.trim();
    if (!raw) return;

    // Generador de pivotes temáticos hacia alto RPM
    const generated: NichePivotSuggestion[] = [
      {
        originalTopic: raw,
        highRpmAngle: `El Negocio Millonario y las Finanzas Ocultas detrás de: ${raw}`,
        hook: `¿Cuánto dinero mueve realmente ${raw}? La cifra real asustaría a cualquiera...`,
        targetTier: 'Tier 1',
        estimatedRpm: 28.5,
        monetizationReason: 'Atrae anunciantes de fondos de inversión, consultoría y software financiero.',
      },
      {
        originalTopic: raw,
        highRpmAngle: `Cómo la Inteligencia Artificial y el Software están Automatizando ${raw}`,
        hook: `El 80% de los profesionales de ${raw} serán reemplazados por estas 3 herramientas...`,
        targetTier: 'Tier 1',
        estimatedRpm: 32.0,
        monetizationReason: 'Monetiza con patrocinios de herramientas SaaS y cursos de IA.',
      },
      {
        originalTopic: raw,
        highRpmAngle: `La Guía Definitiva de Productividad y Sistemas para Dominar ${raw} en 2026`,
        hook: `Si vas a empezar con ${raw}, no pierdas 6 meses cometiendo este error elemental...`,
        targetTier: 'Tier 2',
        estimatedRpm: 12.5,
        monetizationReason: 'Monetiza con marketing de afiliados de hardware y aplicaciones de alto ticket.',
      },
    ];

    setPivots(generated);
  };

  const rpmData = data?.rpmByNiche
    ? [...data.rpmByNiche].sort((a, b) => b.rpm - a.rpm).map(r => ({ ...r, niche: r.niche.length > 14 ? r.niche.substring(0, 14) + '...' : r.niche }))
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-emerald-500" />
          Radar de Monetización & Estrategia de RPM
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Catálogo real de Tiers de RPM y motor de pivote financiero para multiplicar tus ingresos por visita antes de producir.
        </p>
      </div>

      <AIModeBanner available={aiStatus.available} loading={aiStatus.loading} error={aiStatus.error} onRetry={recheckAI} />

      {/* ============================================================== */}
      {/* SECCIÓN 1: CATÁLOGO DE NICHOS POR RPM REAL (TIERS 1, 2, 3) */}
      {/* ============================================================== */}
      <Card className="border-border/60 shadow-sm bg-gradient-to-b from-card to-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Catálogo Estratégico de Tiers de RPM
          </CardTitle>
          <CardDescription className="text-xs">
            Ingresos reales estimados por cada 1.000 visualizaciones (Revenue Per Mille) según anunciantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RPM_TIERS_CATALOG.map((cat) => (
              <div
                key={cat.tier}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                  cat.tier === 'Tier 1'
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : cat.tier === 'Tier 2'
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        cat.tier === 'Tier 1'
                          ? 'bg-emerald-600 text-white font-bold'
                          : cat.tier === 'Tier 2'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-neutral-700 text-white font-bold'
                      }
                    >
                      {cat.tier}
                    </Badge>
                    <span className="font-extrabold text-sm text-foreground">{cat.rpmRange}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{cat.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                  <span className="font-semibold text-foreground text-[11px] block">Nichos Representativos:</span>
                  <div className="flex flex-wrap gap-1">
                    {cat.niches.map((n, idx) => (
                      <span key={idx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-neutral-300">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground pt-1">
                  <strong>Anunciantes:</strong> {cat.advertisers}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* SECCIÓN 2: MOTOR DE PIVOTE HACIA ALTO RPM */}
      {/* ============================================================== */}
      <Card className="border-amber-500/30 bg-gradient-to-b from-amber-950/15 to-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Motor de Pivote hacia Alto RPM (Financial Angle Pivot)
          </CardTitle>
          <CardDescription className="text-xs">
            Transforma cualquier tema popular o de bajo RPM hacia un ángulo financiero de Tier 1 para disparar el valor de tus reproducciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Tema base (Ej: Historia de Roma, Rutina de Gimnasio, Minecraft, Cocina)..."
              value={pivotTopic}
              onChange={(e) => setPivotTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeneratePivots()}
              className="flex-1"
            />
            <Button onClick={handleGeneratePivots} className="gap-2 shrink-0 bg-amber-600 hover:bg-amber-500 text-white font-semibold">
              <Zap className="w-4 h-4" /> Pivotar a Alto RPM
            </Button>
          </div>

          {pivots.length > 0 && (
            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {pivots.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-amber-500/20 bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                        {p.targetTier} (${p.estimatedRpm} RPM)
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Pivote desde: &quot;{p.originalTopic}&quot;
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-foreground">{p.highRpmAngle}</h4>
                    <p className="text-xs text-amber-300 italic">&ldquo;{p.hook}&rdquo;</p>
                    <p className="text-[11px] text-muted-foreground">{p.monetizationReason}</p>
                  </div>

                  {/* Puente de Exportación a YouTube Automation */}
                  <div className="shrink-0 w-full md:w-auto flex justify-end">
                    <ExportToAutomationButton
                      payload={{
                        title: p.highRpmAngle,
                        hook: p.hook,
                        idea_summary: `Pivote de alto RPM (${p.targetTier}: $${p.estimatedRpm} RPM). Diseñado para atraer anunciantes B2B/Financieros.`,
                        target_rpm: p.estimatedRpm,
                        recommended_mode: 'idea',
                        target_format: 'long',
                      }}
                      label="🚀 Enviar a Fábrica"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* SECCIÓN 3: CALCULADORA DE INGRESOS MENSUALES */}
      {/* ============================================================== */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Simulador de Ingresos y Vistas Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Nicho del Canal</label>
              <Input
                placeholder="Ej: Finanzas, Tecnología, Gaming..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Suscriptores:</span>
                <span className="font-bold">{subscribers[0].toLocaleString()}</span>
              </div>
              <Slider
                value={subscribers}
                onValueChange={setSubscribers}
                min={1000}
                max={1000000}
                step={5000}
                className="py-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Vistas / Mes:</span>
                <span className="font-bold">{viewsPerMonth[0].toLocaleString()}</span>
              </div>
              <Slider
                value={viewsPerMonth}
                onValueChange={setViewsPerMonth}
                min={10000}
                max={5000000}
                step={50000}
                className="py-2"
              />
            </div>
          </div>

          <Button onClick={handleCalculate} disabled={loading || !niche.trim()} className="w-full sm:w-auto gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            Calcular Proyección
          </Button>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {data && (
            <div className="space-y-6 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border bg-card text-center">
                  <p className="text-xs text-muted-foreground">RPM Estimado</p>
                  <p className="text-2xl font-black text-emerald-500">${data.rpm.toFixed(2)}</p>
                </div>
                <div className="p-3.5 rounded-xl border bg-card text-center">
                  <p className="text-xs text-muted-foreground">CPM Estimado</p>
                  <p className="text-2xl font-black text-blue-500">${data.cpm.toFixed(2)}</p>
                </div>
                <div className="p-3.5 rounded-xl border bg-card text-center">
                  <p className="text-xs text-muted-foreground">Ingreso Mensual</p>
                  <p className="text-2xl font-black text-foreground">${data.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-xl border bg-card text-center">
                  <p className="text-xs text-muted-foreground">Ingreso Anual</p>
                  <p className="text-2xl font-black text-amber-500">${data.annualRevenue.toLocaleString()}</p>
                </div>
              </div>

              {rpmData.length > 0 && (
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground">Comparativa de RPM por Nichos Relacionados</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={rpmData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="niche" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="rpm" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
