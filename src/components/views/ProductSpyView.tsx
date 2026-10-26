'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportToAutomationButton } from '@/components/shared/ExportToAutomationButton';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { useAIStatus } from '@/hooks/use-ai-status';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingBag,
  Music,
  TrendingUp,
  Flame,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  selling_points: string[];
}

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

export function ProductSpyView() {
  const { toast } = useToast();
  const { status: aiStatus, check: recheckAI } = useAIStatus();

  // Tab 1: Products
  const [productCategory, setProductCategory] = useState('Todas');
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Tab 2: Sounds
  const [soundMood, setSoundMood] = useState('Todos');
  const [sounds, setSounds] = useState<ViralSound[]>([]);
  const [loadingSounds, setLoadingSounds] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchProducts = async (cat: string) => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/winning-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat }),
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      toast({
        title: 'Error escaneando productos',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSounds = async (mood: string) => {
    setLoadingSounds(true);
    try {
      const res = await fetch('/api/viral-sounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });
      const data = await res.json();
      setSounds(data.sounds || []);
    } catch (err: any) {
      toast({
        title: 'Error escaneando audios',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingSounds(false);
    }
  };

  useEffect(() => {
    fetchProducts(productCategory);
    fetchSounds(soundMood);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: '¡Copiado al portapapeles!',
      description: text,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AIModeBanner status={aiStatus} onRetry={recheckAI} />

      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900/60 to-purple-950/30 border border-emerald-500/20 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Radar de Productos & Audios Virales (TikTok & Amazon)
            </h2>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
              SHOP SPY
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Detecta qué productos físicos están vendiendo millones en TikTok Shop / Amazon y qué audios
            virales están empujando el algoritmo esta semana. Transfiérelos con 1-clic a <b>YouTube Automation</b>.
          </p>
        </div>

        <a
          href="http://127.0.0.1:8000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors border border-neutral-700 self-start md:self-auto"
        >
          <span>🏎️ Fábrica Local (:8000)</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Tabs Principales: Productos vs Audios */}
      <Tabs defaultValue="products" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <TabsList className="bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="products" className="gap-2 text-xs">
              <Package className="w-3.5 h-3.5" />
              <span>🛍️ Productos Ganadores ({products.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sounds" className="gap-2 text-xs">
              <Music className="w-3.5 h-3.5" />
              <span>🎵 Audios Virales TikTok ({sounds.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── SUBPESTAÑA 1: PRODUCTOS GANADORES ── */}
        <TabsContent value="products" className="space-y-4 m-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Filtrar por categoría:</span>
              <Select
                value={productCategory}
                onValueChange={(val) => {
                  setProductCategory(val);
                  fetchProducts(val);
                }}
              >
                <SelectTrigger className="w-[180px] h-8 bg-neutral-900 border-neutral-800 text-xs text-white">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white text-xs">
                  <SelectItem value="Todas">Todas las categorías</SelectItem>
                  <SelectItem value="Cocina & Gadgets">🍳 Cocina & Gadgets</SelectItem>
                  <SelectItem value="Salud & Bienestar">🦴 Salud & Bienestar</SelectItem>
                  <SelectItem value="Fitness & Recuperación">💪 Fitness & Deporte</SelectItem>
                  <SelectItem value="Auto & Accesorios">🚗 Auto & Accesorios</SelectItem>
                  <SelectItem value="Hogar & Organización">🏠 Hogar & Organización</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts(productCategory)}
              disabled={loadingProducts}
              className="h-8 text-xs border-neutral-800 bg-neutral-900 text-neutral-300"
            >
              {loadingProducts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🔄 Actualizar</span>}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingProducts ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs">Escaneando Amazon Movers & Shakers y TikTok Shop...</p>
              </div>
            ) : products.map((p, idx) => {
              const satColor =
                p.saturation === 'Baja'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : p.saturation === 'Media'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.04 }}
                >
                  <Card className="h-full flex flex-col justify-between border-neutral-800 hover:border-emerald-500/30 bg-neutral-900/50 hover:bg-neutral-900/80 transition-all">
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge className="text-[10px] bg-neutral-800 text-neutral-400 border-neutral-700 mb-1">
                            {p.category}
                          </Badge>
                          <CardTitle className="text-sm font-bold text-white line-clamp-1">
                            {p.name}
                          </CardTitle>
                        </div>
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 text-xs font-bold">
                          <Flame className="w-3 h-3 mr-1" />
                          {p.velocity}
                        </Badge>
                      </div>

                      {/* Métricas clave */}
                      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-[11px]">
                        <div>
                          <span className="text-neutral-500 block">PVP Est.:</span>
                          <b className="text-white font-mono">{p.price}</b>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Margen:</span>
                          <b className="text-emerald-400 font-mono">{p.profit_margin.split(' ')[0]}</b>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Saturación:</span>
                          <Badge className={`text-[9px] px-1.5 py-0 border ${satColor}`}>
                            {p.saturation}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-between">
                      {/* Gancho Viral */}
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border-l-2 border-emerald-400 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          <span>🎯 Gancho Viral Recomendado:</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.viral_hook, p.id)}
                            className="hover:text-white"
                          >
                            {copiedId === p.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className="text-neutral-200 italic leading-snug">«{p.viral_hook}»</p>
                      </div>

                      {/* Selling Points */}
                      <div className="text-[11.5px] text-neutral-400 space-y-1">
                        {p.selling_points.map((sp, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span>{sp}</span>
                          </div>
                        ))}
                      </div>

                      {/* Enviar a Fábrica */}
                      <div className="pt-2 flex items-center gap-2">
                        <ExportToAutomationButton
                          label="🏎️ Fabricar Video Ad ($0.00)"
                          payload={{
                            title: `UGC Ad: ${p.name.slice(0, 40)}`,
                            hook: p.viral_hook,
                            idea_summary: `Producto ganador (${p.velocity}, margen ${p.profit_margin}). Audiencia: ${p.audience}. Características: ${p.selling_points.join(', ')}`,
                            reference_url: p.source_url,
                            recommended_mode: 'product',
                            target_format: 'short',
                          }}
                          className="flex-1"
                        />
                        <a
                          href={p.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 flex items-center gap-1"
                          title="Ver en tienda"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── SUBPESTAÑA 2: AUDIOS VIRALES TIKTOK ── */}
        <TabsContent value="sounds" className="space-y-4 m-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Estilo / Mood:</span>
              <Select
                value={soundMood}
                onValueChange={(val) => {
                  setSoundMood(val);
                  fetchSounds(val);
                }}
              >
                <SelectTrigger className="w-[180px] h-8 bg-neutral-900 border-neutral-800 text-xs text-white">
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white text-xs">
                  <SelectItem value="Todos">Todos los estilos</SelectItem>
                  <SelectItem value="Divertido">😂 Divertido / Curiosidad</SelectItem>
                  <SelectItem value="Misterio">⚠️ Misterio / Advertencia</SelectItem>
                  <SelectItem value="Motivacion">🧠 Motivación / Estoicismo</SelectItem>
                  <SelectItem value="Energia">⚡ Alta Energía / Phonk</SelectItem>
                  <SelectItem value="Calma">✨ Calma / Estético</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSounds(soundMood)}
              disabled={loadingSounds}
              className="h-8 text-xs border-neutral-800 bg-neutral-900 text-neutral-300"
            >
              {loadingSounds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🔄 Actualizar</span>}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingSounds ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-xs">Rastreando audios en tendencia en TikTok Creative Center...</p>
              </div>
            ) : sounds.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
              >
                <Card className="h-full flex flex-col justify-between border-neutral-800 hover:border-purple-500/30 bg-neutral-900/50 hover:bg-neutral-900/80 transition-all">
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Volume2 className="w-4 h-4" />
                        </span>
                        <div>
                          <CardTitle className="text-sm font-bold text-white line-clamp-1">
                            {s.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-neutral-400">
                            {s.artist}
                          </CardDescription>
                        </div>
                      </div>

                      <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 text-xs font-bold">
                        {s.growth}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Badge className="text-[10px] bg-neutral-800 text-neutral-300 border-neutral-700">
                        {s.mood}
                      </Badge>
                      <span className="text-[11px] text-neutral-400">
                        📊 Usado en: <b className="text-white">{s.video_count}</b>
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs space-y-1">
                      <div className="text-neutral-400">
                        🎯 <b>Nichos recomendados:</b> {s.best_niche}
                      </div>
                      <div className="text-neutral-400">
                        ⏱️ <b>Ritmo visual sugerido:</b>{' '}
                        <Badge className="text-[9px] bg-purple-500/10 text-purple-300 border-purple-500/20">
                          {s.suggested_pacing === 'fast' ? '⚡ Rápido (~2.5s)' : '⏱️ Normal (~4.0s)'}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCopy(s.title, s.id)}
                        className="flex-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white gap-1.5"
                      >
                        {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar Nombre de Audio</span>
                      </Button>

                      <a
                        href={s.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 flex items-center gap-1"
                        title="Ver en TikTok"
                      >
                        <span>TikTok</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
