'use client';

import { useState, useMemo } from 'react';
import { Keyword } from '@/lib/types';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { KeyRound, Search, X, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function KeywordExplorerView() {
  const [niche, setNiche] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [minVolume, setMinVolume] = useState(0);
  const [maxComp, setMaxComp] = useState(100);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const { status: aiStatus, check: recheckAI } = useAIStatus();

  const handleSearch = async () => {
    const safeNiche = niche.trim();
    if (!safeNiche) return;
    setLoading(true);
    setError('');
    setKeywords([]);
    setSelectedKeyword(null);

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: safeNiche }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Error al buscar keywords.');
        return;
      }
      if (Array.isArray(data.keywords) && data.keywords.length > 0) {
        const kws: Keyword[] = data.keywords.map((k: any, i: number) => ({
          id: `kw-${i}`,
          keyword: k.keyword,
          volume: k.volume,
          competition: k.competition,
          cpc: k.cpc,
          trend: k.trend || [],
          relatedKeywords: k.relatedKeywords || [],
        }));
        setKeywords(kws);
      } else {
        setError('No se encontraron keywords.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return keywords.filter(kw => {
      const matchSearch = !search || kw.keyword.toLowerCase().includes(search.toLowerCase());
      const matchVol = kw.volume >= minVolume;
      const matchComp = kw.competition <= maxComp;
      return matchSearch && matchVol && matchComp;
    });
  }, [keywords, search, minVolume, maxComp]);

  const selected = keywords.find(k => k.keyword === selectedKeyword);
  const trendData = selected
    ? selected.trend.map((v, i) => ({ mes: months[i], volumen: v }))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Explorador de Keywords</h2>
        <p className="text-muted-foreground text-sm">Analiza palabras clave y su rendimiento con IA</p>
      </div>

      <AIModeBanner available={aiStatus.available} loading={aiStatus.loading} error={aiStatus.error} onRetry={recheckAI} />

      {/* Search input */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Escribe un nicho para explorar keywords..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              {niche && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setNiche('')}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={loading || !niche.trim()}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Explorar
            </Button>
          </div>

          {keywords.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Volumen mínimo: {minVolume.toLocaleString()}
                </label>
                <Slider value={[minVolume]} onValueChange={([v]) => setMinVolume(v)} max={1000000} step={10000} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Competencia máxima: {maxComp}%
                </label>
                <Slider value={[maxComp]} onValueChange={([v]) => setMaxComp(v)} max={100} step={5} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && !loading && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">No se pudieron obtener keywords</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="text-xs h-7 mt-2" onClick={handleSearch}>Reintentar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="border-primary/20">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Analizando keywords con IA...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && keywords.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <KeyRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Escribe un nicho y pulsa "Explorar" para generar keywords con IA</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {keywords.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />
                  Keywords ({filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-muted-foreground">Keyword</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Volumen</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Compet.</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">CPC</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((kw) => (
                        <tr
                          key={kw.id}
                          className={cn(
                            'border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors',
                            selectedKeyword === kw.keyword && 'bg-primary/5'
                          )}
                          onClick={() => setSelectedKeyword(kw.keyword)}
                        >
                          <td className="p-2 font-medium">{kw.keyword}</td>
                          <td className="p-2 text-right">{(kw.volume / 1000).toFixed(0)}K</td>
                          <td className="p-2 text-right">
                            <Badge variant="outline" className={cn(
                              'text-[10px]',
                              kw.competition >= 70 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              kw.competition >= 45 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            )}>
                              {kw.competition}%
                            </Badge>
                          </td>
                          <td className="p-2 text-right">${kw.cpc.toFixed(2)}</td>
                          <td className="p-2">
                            {kw.trend.length > 0 ? (
                              <div className="flex justify-center">
                                <svg width="60" height="20" className="overflow-visible">
                                  <polyline
                                    fill="none"
                                    stroke={kw.trend[kw.trend.length - 1] > kw.trend[0] ? '#10b981' : '#f43f5e'}
                                    strokeWidth="1.5"
                                    points={kw.trend.map((v, i) => {
                                      const min = Math.min(...kw.trend);
                                      const max = Math.max(...kw.trend);
                                      const range = max - min || 1;
                                      const x = (i / (kw.trend.length - 1)) * 60;
                                      const y = 20 - ((v - min) / range) * 18;
                                      return `${x},${y}`;
                                    }).join(' ')}
                                  />
                                </svg>
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Keyword Detail */}
          <div className="space-y-4">
            {selected && trendData ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{selected.keyword}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="text-center p-2 rounded bg-muted/30">
                        <p className="text-sm font-bold">{(selected.volume / 1000).toFixed(0)}K</p>
                        <p className="text-[10px] text-muted-foreground">Volumen/mes</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <p className="text-sm font-bold">${selected.cpc.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">CPC</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="volumen" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Keywords Relacionadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selected.relatedKeywords.map(kw => (
                        <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecciona una keyword para ver su detalle</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
