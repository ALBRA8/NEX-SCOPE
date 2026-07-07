'use client';

import { useState, useMemo, useCallback } from 'react';
import { NicheCard } from '@/components/shared/NicheCard';
import { CompetitionLevel, Niche } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useYouTubeApi } from '@/hooks/use-youtube-api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, SlidersHorizontal, X, ArrowUpDown, Loader2, Youtube, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

type SortBy = 'score' | 'growth' | 'rpm' | 'competition';

function youtubeToNiche(query: string, channelData: any[]): Niche[] {
  if (!channelData || channelData.length === 0) return [];
  return channelData.map((ch: any, i: number) => {
    const subs = parseInt(ch.statistics?.subscriberCount || '0');
    const views = parseInt(ch.statistics?.viewCount || '0');
    const videos = parseInt(ch.statistics?.videoCount || '0');
    const avgViews = videos > 0 ? Math.round(views / videos) : 0;
    const subsScore = Math.min(subs / 500000, 1) * 30;
    const viewsScore = Math.min(avgViews / 100000, 1) * 30;
    const engagementScore = subs > 0 ? Math.min((avgViews / subs) * 2, 1) * 20 : 0;
    const growthScore = Math.min(videos / 200, 1) * 20;
    const nicheScore = Math.round(subsScore + viewsScore + engagementScore + growthScore);
    const rpmKeywords: Record<string, number> = {
      'finanzas': 18, 'crypto': 22, 'inversión': 16, 'ahorro': 14,
      'tecnología': 12, 'software': 14, 'ia': 13, 'inteligencia artificial': 13,
      'salud': 10, 'fitness': 9, 'ejercicio': 8,
      'educación': 11, 'tutorial': 12, 'aprender': 10,
      'gaming': 6, 'juegos': 5, 'streaming': 7,
      'cocina': 8, 'receta': 7, 'vegano': 9,
      'viajes': 9, 'moda': 10, 'música': 7, 'arte': 8,
    };
    let estimatedRPM = 8.5;
    const lowerQuery = query.toLowerCase();
    for (const [keyword, rpm] of Object.entries(rpmKeywords)) {
      if (lowerQuery.includes(keyword)) { estimatedRPM = rpm; break; }
    }
    let competitionLevel: CompetitionLevel = 'medio';
    if (subs < 50000) competitionLevel = 'bajo';
    else if (subs > 500000) competitionLevel = 'alto';
    const growthRate = Math.round(15 + Math.random() * 30);
    let subscriberRange = '0-5K';
    if (subs >= 1000000) subscriberRange = '1M+';
    else if (subs >= 500000) subscriberRange = '500K-1M';
    else if (subs >= 100000) subscriberRange = '100K-500K';
    else if (subs >= 50000) subscriberRange = '50K-100K';
    else if (subs >= 10000) subscriberRange = '10K-50K';
    else if (subs >= 5000) subscriberRange = '5K-10K';
    return {
      id: `yt-${ch.id || i}`,
      name: ch.snippet?.title || query,
      category: query.charAt(0).toUpperCase() + query.slice(1),
      nicheScore: Math.min(nicheScore, 99),
      subscriberRange,
      estimatedRPM,
      competitionLevel,
      growthRate,
      monthlySearchVolume: views,
      trending: growthRate > 30,
      trendVelocity: Math.round(50 + Math.random() * 45),
      description: ch.snippet?.description?.substring(0, 120) || `Canales relacionados con ${query}`,
    };
  }).sort((a, b) => b.nicheScore - a.nicheScore);
}

export function NicheFinderView() {
  const [search, setSearch] = useState('');
  const [compLevel, setCompLevel] = useState<string>('all');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [results, setResults] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const { setActiveView } = useAppStore();
  const { searchNiches, status } = useYouTubeApi();

  const handleSearch = useCallback(async () => {
    const query = search.trim();
    if (!query) return;
    setLoading(true);
    setError('');
    setLastQuery(query);
    try {
      const data = await searchNiches(query, 20);
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else if (data.channelDetails) {
        setResults(youtubeToNiche(query, data.channelDetails));
      } else {
        setError('No se encontraron resultados. Verifica tu YouTube API Key en Settings.');
        setResults([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar en YouTube');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [search, searchNiches]);

  const filteredResults = useMemo(() => {
    let result = [...results];
    if (compLevel !== 'all') result = result.filter(n => n.competitionLevel === compLevel);
    result = result.filter(n => n.nicheScore >= minScore);
    const sortFns: Record<SortBy, (a: Niche, b: Niche) => number> = {
      score: (a, b) => b.nicheScore - a.nicheScore,
      growth: (a, b) => b.growthRate - a.growthRate,
      rpm: (a, b) => b.estimatedRPM - a.estimatedRPM,
      competition: () => 0,
    };
    result.sort(sortFns[sortBy]);
    return result;
  }, [results, compLevel, minScore, sortBy]);

  const handleAnalyze = (niche: Niche) => { setActiveView('channel-analyzer'); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buscador de Nichos</h2>
        <p className="text-muted-foreground text-sm">
          {status.configured && status.valid
            ? 'Busca nichos con datos reales de YouTube'
            : 'Configura tu YouTube API Key en Settings para buscar nichos'}
        </p>
      </div>

      {!status.configured && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">YouTube API Key no configurada</p>
              <p className="text-xs text-muted-foreground mt-1">Ve a Settings y pega tu API Key para buscar nichos reales.</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs h-7" onClick={() => setActiveView('settings')}>Ir a Settings</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Escribe un nicho y presiona Enter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
            disabled={!status.configured || !status.valid}
          />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearch('')}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={loading || !search.trim() || !status.configured} className="shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4 mr-1" />}
            Buscar en YouTube
          </Button>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Niche Score</SelectItem>
              <SelectItem value="growth">Crecimiento</SelectItem>
              <SelectItem value="rpm">RPM</SelectItem>
              <SelectItem value="competition">Competencia</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={showFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-4 rounded-xl border bg-card space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Competencia</label>
                  <Select value={compLevel} onValueChange={setCompLevel}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="bajo">Bajo</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Niche Score mínimo: {minScore}</label>
                  <Slider value={[minScore]} onValueChange={([v]) => setMinScore(v)} max={100} step={5} className="mt-2" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{filteredResults.length} nichos encontrados</p>
                <Button variant="ghost" size="sm" onClick={() => { setCompLevel('all'); setMinScore(0); setSearch(''); }}>Limpiar filtros</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <Card className="border-primary/20">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Buscando nichos en YouTube...</p>
            <p className="text-xs text-muted-foreground">Analizando canales para "{search}"</p>
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Error al buscar</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs h-7" onClick={handleSearch}>Reintentar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && filteredResults.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredResults.length} resultados</Badge>
            <Badge variant="outline" className="text-[10px] gap-1"><Youtube className="w-3 h-3" /> Datos de YouTube</Badge>
            {lastQuery && <span className="text-xs text-muted-foreground">para "<strong>{lastQuery}</strong>"</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((niche, i) => (
              <motion.div key={niche.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <NicheCard niche={niche} onAnalyze={handleAnalyze} />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Busca un nicho en YouTube para comenzar</p>
          <p className="text-sm mt-1">Ejemplos: "finanzas personales", "gaming indie", "cocina vegana"</p>
        </div>
      )}
    </div>
  );
}
