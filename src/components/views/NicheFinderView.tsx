'use client';

import { useState, useMemo } from 'react';
import { NicheCard } from '@/components/shared/NicheCard';
import { niches, categories } from '@/lib/mock-data';
import { CompetitionLevel, Niche } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortBy = 'score' | 'growth' | 'rpm' | 'competition';

export function NicheFinderView() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [compLevel, setCompLevel] = useState<string>('all');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const { setActiveView } = useAppStore();

  const filteredNiches = useMemo(() => {
    let result = [...niches];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.name.toLowerCase().includes(q) || n.category.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') {
      result = result.filter(n => n.category === category);
    }
    if (compLevel !== 'all') {
      result = result.filter(n => n.competitionLevel === compLevel);
    }
    result = result.filter(n => n.nicheScore >= minScore);

    // Sort
    const sortFns: Record<SortBy, (a: Niche, b: Niche) => number> = {
      score: (a, b) => b.nicheScore - a.nicheScore,
      growth: (a, b) => b.growthRate - a.growthRate,
      rpm: (a, b) => b.estimatedRPM - a.estimatedRPM,
      competition: (a, b) => {
        const order: Record<CompetitionLevel, number> = { bajo: 0, medio: 1, alto: 2 };
        return order[a.competitionLevel] - order[b.competitionLevel];
      },
    };
    result.sort(sortFns[sortBy]);

    return result;
  }, [search, category, compLevel, minScore, sortBy]);

  const handleAnalyze = (niche: Niche) => {
    setActiveView('channel-analyzer');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buscador de Nichos</h2>
        <p className="text-muted-foreground text-sm">Descubre nichos rentables con análisis avanzado</p>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nicho por nombre o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearch('')}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
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
                <p className="text-xs text-muted-foreground">{filteredNiches.length} nichos encontrados</p>
                <Button variant="ghost" size="sm" onClick={() => { setCategory('all'); setCompLevel('all'); setMinScore(0); setSearch(''); }}>
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{filteredNiches.length} resultados</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNiches.map((niche, i) => (
          <motion.div key={niche.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <NicheCard niche={niche} onAnalyze={handleAnalyze} />
          </motion.div>
        ))}
      </div>

      {filteredNiches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron nichos con esos filtros</p>
          <p className="text-sm">Intenta ajustar los criterios de búsqueda</p>
        </div>
      )}
    </div>
  );
}
