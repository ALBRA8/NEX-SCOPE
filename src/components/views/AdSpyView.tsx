'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportToAutomationButton } from '@/components/shared/ExportToAutomationButton';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { useAIStatus } from '@/hooks/use-ai-status';
import { useToast } from '@/hooks/use-toast';
import {
  Radar,
  Search,
  Loader2,
  ExternalLink,
  Flame,
  Zap,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Wrench,
  Star,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface CompetitorAd {
  id: string;
  brand_name: string;
  platform: 'meta' | 'tiktok';
  headline: string;
  copy_text: string;
  hook: string;
  hook_category: 'advertencia' | 'curiosidad' | 'problema_solucion' | 'prueba_social';
  days_active: number;
  winning_score: number;
  media_type: 'video' | 'image' | 'carousel';
  cta: string;
  source_url?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  advertencia: { label: 'Advertencia', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  curiosidad: { label: 'Curiosidad', icon: Lightbulb, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  problema_solucion: { label: 'Problema vs Solución', icon: Wrench, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  prueba_social: { label: 'Prueba Social', icon: Star, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export function AdSpyView() {
  const { toast } = useToast();
  const { status: aiStatus, check: recheckAI } = useAIStatus();
  const [query, setQuery] = useState('');
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [filteredAds, setFilteredAds] = useState<CompetitorAd[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filterAdsList = useCallback((list: CompetitorAd[], category: string) => {
    if (category === 'all') {
      setFilteredAds(list);
    } else {
      setFilteredAds(list.filter((a) => a.hook_category === category));
    }
  }, []);

  const handleSearch = async (searchTerm?: string) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) {
      toast({
        title: 'Ingresa un nicho o marca',
        description: 'Escribe un producto o competidor para escanear en el radar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/ad-spy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Fallo al consultar el radar');
      }

      const received = data.ads || [];
      setAds(received);
      filterAdsList(received, categoryFilter);

      toast({
        title: '¡Radar completado!',
        description: `Se detectaron ${received.length} anuncios ganadores para "${q}".`,
      });
    } catch (err: any) {
      toast({
        title: 'Error de escaneo',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    filterAdsList(ads, val);
  };

  const handleCopyHook = (hookText: string, id: string) => {
    navigator.clipboard.writeText(hookText);
    setCopiedId(id);
    toast({
      title: '¡Gancho copiado!',
      description: 'Listo para usar en tu próximo video.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AIModeBanner status={aiStatus} onRetry={recheckAI} />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-neutral-900/60 to-emerald-950/30 border border-sky-500/20 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Radar className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Radar de Anuncios Ganadores (Creatify Style)
            </h2>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
              RADAR ACTIVO
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Espía Meta Ad Library y TikTok para identificar creativos que llevan semanas activos.
            Extrae sus ganchos y envíalos en 1-clic a <b>YouTube Automation</b> para producirlos a coste $0.00.
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

      {/* Barra de Búsqueda y Filtros */}
      <Card className="border-neutral-800 bg-neutral-900/60">
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Ingresa marca o nicho (ej: 'cafetera portatil', 'gymshark', 'corrector postura')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-neutral-950/80 border-neutral-800 text-sm h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold h-10 px-5 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Escaneando...</span>
                </>
              ) : (
                <>
                  <Radar className="w-4 h-4" />
                  <span>Escanear Radar</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-neutral-500 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Nichos:
            </span>
            {[
              'Cafetera Portátil',
              'Corrector de Postura',
              'Organizador de Cocina',
              'Masajeador Cervical',
              'Gadgets para Auto',
            ].map((niche) => (
              <button
                key={niche}
                type="button"
                onClick={() => {
                  setQuery(niche);
                  handleSearch(niche);
                }}
                className="px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-sky-500/10 hover:text-sky-300 hover:border-sky-500/30 border border-neutral-700/60 text-neutral-300 text-[11px] transition-all"
              >
                {niche}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Header de Resultados y Filtro de Categoría */}
      {searched && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              Anuncios Ganadores Detectados ({filteredAds.length})
            </h3>
            {filteredAds.length > 0 && (
              <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-xs">
                Score Ordenado
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Fórmula de gancho:</span>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[200px] h-8 bg-neutral-900 border-neutral-800 text-xs">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white text-xs">
                <SelectItem value="all">Todas las fórmulas</SelectItem>
                <SelectItem value="advertencia">⚠️ Advertencia (No compres)</SelectItem>
                <SelectItem value="curiosidad">💡 Curiosidad (El secreto)</SelectItem>
                <SelectItem value="problema_solucion">🛠️ Problema vs Solución</SelectItem>
                <SelectItem value="prueba_social">⭐ Prueba Social / Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Grid de Anuncios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-sm font-medium">Interrogando Meta Ad Library y analizando ganchos con IA...</p>
          </div>
        ) : filteredAds.length > 0 ? (
          filteredAds.map((ad, idx) => {
            const catInfo = CATEGORY_LABELS[ad.hook_category] || CATEGORY_LABELS.curiosidad;
            const CatIcon = catInfo.icon;
            const isTopWinner = ad.winning_score >= 85;

            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="h-full flex flex-col justify-between border-neutral-800 hover:border-sky-500/40 bg-neutral-900/50 hover:bg-neutral-900/80 transition-all duration-200">
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{ad.brand_name}</span>
                          <span className="text-[10px] text-neutral-400 font-normal uppercase tracking-wider">
                            ({ad.platform} · {ad.media_type})
                          </span>
                        </CardTitle>
                        <CardDescription className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                          {ad.headline}
                        </CardDescription>
                      </div>

                      {/* Score Badge */}
                      <div className="flex flex-col items-end">
                        <Badge
                          className={`text-xs font-bold border ${
                            isTopWinner
                              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-500'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isTopWinner ? <Flame className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                          {ad.winning_score}/100
                        </Badge>
                        <span className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                          Activo {ad.days_active} días
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] border flex items-center gap-1 ${catInfo.color}`}>
                        <CatIcon className="w-2.5 h-2.5" />
                        <span>{catInfo.label}</span>
                      </Badge>
                      <span className="text-[11px] text-neutral-400">
                        CTA: <b className="text-neutral-300">{ad.cta}</b>
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Hook Box */}
                    <div className="p-2.5 rounded-lg bg-sky-950/20 border-l-2 border-sky-400 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                        <span>🎯 Gancho Extraído:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyHook(ad.hook, ad.id)}
                          className="hover:text-white transition-colors"
                          title="Copiar gancho"
                        >
                          {copiedId === ad.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-neutral-200 italic leading-snug">«{ad.hook}»</p>
                    </div>

                    {/* Copy text preview */}
                    <div className="text-xs text-neutral-400 line-clamp-3 leading-relaxed bg-neutral-950/40 p-2 rounded border border-neutral-800/60">
                      {ad.copy_text}
                    </div>

                    {/* Actions: Export to YouTube Automation */}
                    <div className="pt-2 flex items-center gap-2">
                      <ExportToAutomationButton
                        label="🏎️ Fabricar en YouTube ($0.00)"
                        payload={{
                          title: `Anuncio Remezclado: ${ad.brand_name}`,
                          hook: ad.hook,
                          idea_summary: `Anuncio ganador (${ad.days_active} días activo en ${ad.platform}). Fórmula: ${catInfo.label}. Copy original: ${ad.copy_text.slice(0, 180)}`,
                          reference_url: ad.source_url || '',
                          recommended_mode: 'product',
                          target_format: 'short',
                        }}
                        className="flex-1"
                      />

                      {ad.source_url && (
                        <a
                          href={ad.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 flex items-center gap-1"
                          title="Inspeccionar en Meta Ad Library"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : searched ? (
          <div className="col-span-full py-12 text-center text-neutral-400">
            <p className="text-sm">No se encontraron anuncios para el filtro seleccionado.</p>
          </div>
        ) : (
          <div className="col-span-full py-16 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
            <Radar className="w-8 h-8 mx-auto mb-2 opacity-40 text-sky-400" />
            <p className="text-sm">Ingresa un término arriba para rastrear anuncios ganadores en tiempo real.</p>
          </div>
        )}
      </div>
    </div>
  );
}
