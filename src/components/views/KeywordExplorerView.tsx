'use client';

import { useState, useMemo } from 'react';
import { keywords } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { KeyRound, Search, X, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function KeywordExplorerView() {
  const [search, setSearch] = useState('');
  const [minVolume, setMinVolume] = useState(0);
  const [maxComp, setMaxComp] = useState(100);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return keywords.filter(kw => {
      const matchSearch = !search || kw.keyword.toLowerCase().includes(search.toLowerCase());
      const matchVol = kw.volume >= minVolume;
      const matchComp = kw.competition <= maxComp;
      return matchSearch && matchVol && matchComp;
    });
  }, [search, minVolume, maxComp]);

  const selected = keywords.find(k => k.keyword === selectedKeyword);
  const trendData = selected
    ? selected.trend.map((v, i) => ({ mes: months[i], volumen: v }))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Explorador de Keywords</h2>
        <p className="text-muted-foreground text-sm">Analiza palabras clave y su rendimiento</p>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar keyword..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Volumen mínimo: {minVolume.toLocaleString()}
              </label>
              <Slider value={[minVolume]} onValueChange={([v]) => setMinVolume(v)} max={500000} step={10000} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Competencia máxima: {maxComp}%
              </label>
              <Slider value={[maxComp]} onValueChange={([v]) => setMaxComp(v)} max={100} step={5} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keywords Table */}
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
    </div>
  );
}
