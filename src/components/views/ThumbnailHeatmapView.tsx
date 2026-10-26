'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportToAutomationButton } from '@/components/shared/ExportToAutomationButton';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { useAIStatus } from '@/hooks/use-ai-status';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Flame,
  Smartphone,
  Sparkles,
  Zap,
  TrendingUp,
  Copy,
  Check,
  Loader2,
  Maximize2,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const PRESET_THUMBNAILS = [
  {
    name: 'Misterio & Arqueología',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&h=720&fit=crop',
    title: 'El artefacto que la ciencia se niega a tocar',
    niche: 'Misterio',
  },
  {
    name: 'Finanzas & Dinero',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1280&h=720&fit=crop',
    title: 'Por qué tener $10,000 en el banco es una trampa',
    niche: 'Finanzas',
  },
  {
    name: 'Tecnología & IA',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&h=720&fit=crop',
    title: '5 herramientas de IA que parecen ilegales',
    niche: 'Tecnología',
  },
  {
    name: 'Salud & Productividad',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1280&h=720&fit=crop',
    title: 'El hábito de 2 minutos que resetea tu dopamina',
    niche: 'Salud',
  },
];

export function ThumbnailHeatmapView() {
  const [imageUrl, setImageUrl] = useState<string>(PRESET_THUMBNAILS[0].url);
  const [videoTitle, setVideoTitle] = useState<string>(PRESET_THUMBNAILS[0].title);
  const [niche, setNiche] = useState<string>(PRESET_THUMBNAILS[0].niche);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [simulateMobile, setSimulateMobile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  const { status: aiStatus } = useAIStatus();
  const { toast } = useToast();

  const analyzeThumbnail = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/thumbnail-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, title: videoTitle, niche }),
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err: any) {
      toast({
        title: 'Error analizando miniatura',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeThumbnail();
  }, [imageUrl, niche]);

  const selectPreset = (preset: typeof PRESET_THUMBNAILS[0]) => {
    setImageUrl(preset.url);
    setVideoTitle(preset.title);
    setNiche(preset.niche);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTitle(text);
    toast({
      title: '¡Título copiado!',
      description: 'Listo para pegar en tu video.',
    });
    setTimeout(() => setCopiedTitle(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner */}
      <AIModeBanner
        aiStatus={aiStatus}
        customTitle="Simulador de Heatmap & Predictor de CTR (Vanta & 1of10 Cloned)"
        customDescription="Evalúa la retención visual de tu miniatura en pantallas móviles con mapa de calor de atención ocular (Eye-Tracking) y predicción de CTR antes de publicar."
      />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 font-bold">
              <Eye className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Heatmap de Atención Visual & Predictor CTR</h2>
            <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-400 border-rose-500/20">
              INT-065
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Los primeros 0.8 segundos deciden si un usuario hace clic o sigue bajando.
          </p>
        </div>

        {/* View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={showHeatmap ? 'default' : 'outline'}
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Layers className="w-3.5 h-3.5" />
            {showHeatmap ? 'Ocultar Heatmap' : 'Ver Heatmap Ocular'}
          </Button>

          <Button
            size="sm"
            variant={simulateMobile ? 'default' : 'outline'}
            onClick={() => setSimulateMobile(!simulateMobile)}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {simulateMobile ? 'Vista Normal' : 'Simular Móvil (Feed)'}
          </Button>
        </div>
      </div>

      {/* Preset Selector & Input Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-card/40 p-4 rounded-xl border border-border/60">
        <span className="text-xs font-bold text-muted-foreground shrink-0">Ejemplos:</span>
        <div className="flex flex-wrap gap-2 flex-1">
          {PRESET_THUMBNAILS.map((p, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={imageUrl === p.url ? 'secondary' : 'ghost'}
              className="text-xs h-8"
              onClick={() => selectPreset(p)}
            >
              {p.name}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Pega la URL de cualquier miniatura..."
            className="h-8 text-xs w-full md:w-72"
          />
          <Button
            size="sm"
            onClick={analyzeThumbnail}
            disabled={loading}
            className="h-8 text-xs font-semibold shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analizar
          </Button>
        </div>
      </div>

      {/* Main Grid: Visual Canvas + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Thumbnail & Heatmap Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border-border/80 shadow-md bg-card/80">
            <div
              className={`relative mx-auto transition-all duration-300 ${
                simulateMobile ? 'max-w-sm py-4 px-3 bg-black rounded-3xl border-4 border-neutral-800' : 'w-full'
              }`}
            >
              {/* 16:9 Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-950">
                <img
                  src={imageUrl}
                  alt="Miniatura a evaluar"
                  className="w-full h-full object-cover"
                />

                {/* Simulated Heatmap Glow Overlay */}
                {showHeatmap && analysis?.focal_points && (
                  <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-90 transition-opacity">
                    {analysis.focal_points.map((pt: any, i: number) => (
                      <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          left: `${pt.x}%`,
                          top: `${pt.y}%`,
                          width: `${pt.radius * 2.8}%`,
                          height: `${pt.radius * 2.8 * (16 / 9)}%`,
                          transform: 'translate(-50%, -50%)',
                          background: `radial-gradient(circle, rgba(239,68,68,${pt.intensity}) 0%, rgba(245,158,11,${pt.intensity * 0.7}) 40%, rgba(16,185,129,${pt.intensity * 0.3}) 70%, transparent 100%)`,
                          filter: 'blur(16px)',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Focal Points Pins */}
                {showHeatmap && analysis?.focal_points && (
                  <div className="absolute inset-0 pointer-events-none">
                    {analysis.focal_points.map((pt: any, i: number) => (
                      <div
                        key={i}
                        className="absolute flex items-center gap-1.5"
                        style={{
                          left: `${pt.x}%`,
                          top: `${pt.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg animate-ping absolute" />
                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg relative flex items-center justify-center text-[8px] font-bold text-white">
                          {i + 1}
                        </div>
                        <span className="text-[10px] font-extrabold text-white bg-black/80 px-2 py-0.5 rounded backdrop-blur shadow whitespace-nowrap">
                          {pt.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulated Mobile Feed Meta info */}
              {simulateMobile && (
                <div className="mt-3 px-1 flex gap-2.5 items-start">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 shrink-0 border border-white/20" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-white leading-snug line-clamp-2">
                      {videoTitle}
                    </p>
                    <span className="text-[10px] text-neutral-400 block">
                      Canal Creador · 348K vistas · hace 2 días
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Heatmap Legend */}
            {showHeatmap && (
              <div className="px-4 py-2.5 bg-background/60 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Escala de Atención Visual:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Máxima Fijación (0.2s)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Atención Media
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Zona Secundaria
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* AI Critique Card */}
          {analysis && (
            <Card className="border-border/80 bg-card/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" /> Diagnóstico del Algoritmo de Visión:
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {analysis.critique}
              </p>
            </Card>
          )}
        </div>

        {/* Right: Scores & High-CTR Title Predictions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main CTR Score Card */}
          <Card className="border-border/80 bg-gradient-to-br from-card to-card/60 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Predicción de Clics
                </span>
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>{analysis?.predicted_ctr || '--'}</span>
                  <span className="text-sm font-normal text-muted-foreground">/ 100 CTR Score</span>
                </h3>
              </div>
              <Badge
                className={`text-xs px-3 py-1 font-bold ${
                  (analysis?.predicted_ctr || 0) >= 80
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {analysis?.verdict || 'Analizando...'}
              </Badge>
            </div>

            {/* 3 Metrics Progress Bars */}
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>📱 Legibilidad en Móvil (5 pulgadas)</span>
                  <strong className="text-foreground">{analysis?.mobile_readability || 0}%</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${analysis?.mobile_readability || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>😱 Impacto Emocional / Expresión</span>
                  <strong className="text-foreground">{analysis?.facial_emotion || 0}%</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${analysis?.facial_emotion || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>🎨 Contraste de Colores vs Dark Mode</span>
                  <strong className="text-foreground">{analysis?.contrast_score || 0}%</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${analysis?.contrast_score || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* High-CTR Title Variations */}
          <Card className="border-border/80 bg-card/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                Títulos Optimizados para este Visual:
              </h4>
              <span className="text-[10px] text-amber-400 font-semibold">1-Clic Copy</span>
            </div>

            <div className="space-y-2.5">
              {(analysis?.high_ctr_titles || []).map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-background/50 border border-border/40 hover:border-amber-500/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-foreground leading-snug">{t.title}</p>
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30 shrink-0">
                      {t.ctr_boost}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30">
                    <span className="text-muted-foreground">{t.angle}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(t.title)}
                      >
                        {copiedTitle === t.title ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedTitle === t.title ? 'Copiado' : 'Copiar'}
                      </Button>
                      <ExportToAutomationButton
                        topic={t.title}
                        category={niche}
                        variant="default"
                        size="sm"
                        className="h-7 text-[11px] px-2.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
