'use client';

import { useState, useMemo, useCallback } from 'react';
import { NicheCard } from '@/components/shared/NicheCard';
import { niches as mockNiches, categories } from '@/lib/mock-data';
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
type DataSource = 'mock' | 'youtube';

// Convert YouTube search results to Niche format
function youtubeToNiche(query: string, searchData: any, channelData: any[]): Niche[] {
  if (!channelData || channelData.length === 0) return [];

  return channelData.map((ch: any, i: number) => {
    const subs = parseInt(ch.statistics?.subscriberCount || '0');
    const views = parseInt(ch.statistics?.viewCount || '0');
    const videos = parseInt(ch.statistics?.videoCount || '0');
    const avgViews = videos > 0 ? Math.round(views / videos) : 0;

    // Calculate niche score based on channel metrics
    const subsScore = Math.min(subs / 500000, 1) * 30;
    const viewsScore = Math.min(avgViews / 100000, 1) * 30;
    const engagementScore = subs > 0 ? Math.min((avgViews / subs) * 2, 1) * 20 : 0;
    const growthScore = Math.min(videos / 200, 1) * 20;
    const nicheScore = Math.round(subsScore + viewsScore + engagementScore + growthScore);

    // Estimate RPM based on common YouTube niches
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
      if (lowerQuery.includes(keyword)) {
        estimatedRPM = rpm;
        break;
      }
    }

    // Competition level based on subscriber count
    let competitionLevel: CompetitionLevel = 'medio';
    if (subs < 50000) competitionLevel = 'bajo';
    else if (subs > 500000) competitionLevel = 'alto';

    // Growth rate estimate
    const growthRate = Math.round(15 + Math.random() * 30);

    // Subscriber range
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
  const [category, setCategory] = useState<string>('all');
  const [compLevel, setCompLevel] = useState<string>('all');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const { setActiveView } = useAppStore();
  const { searchNiches, status } = useYouTubeApi();

  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [youtubeResults, setYoutubeResults] = useState<Niche[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [lastQuery, setLastQuery] = useState('');

  // Search YouTube API
  const handleYouTubeSearch = useCallback(async () => {
    const query = search.trim();
    if (!query) return;

    setYoutubeLoading(true);
    setYoutubeError('');
    setLastQuery(query);
    setDataSource('youtube');

    try {
      const data = await searchNiches(query, 20);
      if (data.error) {
        setYoutubeError(data.error);
        setYoutubeResults([]);
      } else if (data.channelDetails) {
        const niches = youtubeToNiche(query, data.searchResults, data.channelDetails);
        setYoutubeResults(niches);
      } else {
        setYoutubeError('No se encontraron resultados');
        setYoutubeResults([]);
      }
    } catch (err: any) {
      setYoutubeError(err.message || 'Error al buscar en YouTube');
      setYoutubeResults([]);
    } finally {
      setYoutubeLoading(false);
    }
  }, [search, searchNiches]);

  // Filter mock data
  const filteredMockNiches = useMemo(() => {
    let result = [...mockNiches];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.name.toLowerCase().includes(q) || n.category.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') result = result.filter(n => n.category === category);
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
  }, [search, category, compLevel, minScore, sortBy]);

  // Filter YouTube results
  const filteredYoutubeResults = useMemo(() => {
    let result = [...youtubeResults];
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
  }, [youtubeResults, compLevel, minScore, sortBy]);

  const activeResults = dataSource === 'youtube' ? filteredYoutubeResults : filteredMockNiches;

  const handleAnalyze = (niche: Niche) => {
    setActiveView('channel-analyzer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status.configured && status.valid) {
      handleYouTubeSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buscador de Nichos</h2>
        <p className="text-muted-foreground text-sm">
          {status.configured && status.valid
            ? 'Busca nichos con datos reales de YouTube o explora datos de demostración'
            : 'Descubre nichos rentables con análisis avanzado (datos de demostración)'}
        </p>
      </div>

      {/* Data Source Toggle */}
      {status.configured && status.valid && (
        <div className="flex items-center gap-2">
          <Button
            variant={dataSource === 'mock' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setDataSource('mock'); setYoutubeResults([]); setYoutubeError(''); }}
            className="text-xs"
          >
            📊 Demo
          </Button>
          <Button
            variant={dataSource === 'youtube' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (search.trim()) {
                handleYouTubeSearch();
              } else {
                setDataSource('youtube');
              }
            }}
            className="text-xs"
          >
            <Youtube className="w-3.5 h-3.5 mr-1" />
            YouTube Live
          </Button>
          {dataSource === 'youtube' && lastQuery && (
            <span className="text-xs text-muted-foreground">
              Resultados para: "<strong>{lastQuery}</strong>"
            </span>
          )}
        </div>
      )}

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={dataSource === 'youtube' ? 'Escribe un nicho y presiona Enter o Buscar...' : 'Buscar nicho por nombre o categoría...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearch('')}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {dataSource === 'youtube' && (
            <Button
              onClick={handleYouTubeSearch}
              disabled={youtubeLoading || !search.trim()}
              className="shrink-0"
            >
              {youtubeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4 mr-1" />}
              Buscar en YouTube
            </Button>
          )}
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
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border bg-card space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {dataSource === 'mock' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Categoría</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Competencia</label>
                  <Select value={compLevel} onValueChange={setCompLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="bajo">Bajo</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Niche Score mínimo: {minScore}
                  </label>
                  <Slider
                    value={[minScore]}
                    onValueChange={([v]) => setMinScore(v)}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{activeResults.length} nichos encontrados</p>
                <Button variant="ghost" size="sm" onClick={() => { setCategory('all'); setCompLevel('all'); setMinScore(0); setSearch(''); }}>
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {youtubeLoading && (
        <Card className="border-primary/20">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Buscando nichos en YouTube...</p>
            <p className="text-xs text-muted-foreground">Analizando canales para "{search}"</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {youtubeError && !youtubeLoading && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-600">Error al buscar</p>
              <p className="text-xs text-muted-foreground mt-1">{youtubeError}</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs h-7" onClick={handleYouTubeSearch}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!youtubeLoading && (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{activeResults.length} resultados</Badge>
            {dataSource === 'youtube' && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Youtube className="w-3 h-3" /> Datos de YouTube
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeResults.map((niche, i) => (
              <motion.div key={niche.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <NicheCard niche={niche} onAnalyze={handleAnalyze} />
              </motion.div>
            ))}
          </div>

          {activeResults.length === 0 && !youtubeError && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No se encontraron nichos con esos filtros</p>
              <p className="text-sm">
                {dataSource === 'youtube'
                  ? 'Intenta con otro término de búsqueda'
                  : 'Intenta ajustar los criterios de búsqueda'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
