'use client';

import { useState } from 'react';
import { channels } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Legend,
} from 'recharts';
import { Swords, Trophy, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
const DIMENSIONS = ['Suscriptores', 'Vistas', 'Frecuencia', 'Engagement', 'Ingresos', 'Niche Score'];

export function CompetitorMatrixView() {
  const [selectedIds, setSelectedIds] = useState<string[]>([channels[0].id, channels[1].id]);
  const [addingSlot, setAddingSlot] = useState<number | null>(null);

  const selectedChannels = channels.filter(c => selectedIds.includes(c.id));

  const addChannel = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
    setAddingSlot(null);
  };

  const removeChannel = (id: string) => {
    if (selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  // Normalize to 0-100 scale for radar
  const maxSubs = Math.max(...channels.map(c => c.subscribers));
  const maxViews = Math.max(...channels.map(c => c.totalViews));
  const maxRevenue = Math.max(...channels.map(c => c.estimatedRevenue));

  const radarData = DIMENSIONS.map(dim => {
    const entry: Record<string, string | number> = { dimension: dim };
    selectedChannels.forEach(ch => {
      let value = 0;
      switch (dim) {
        case 'Suscriptores': value = (ch.subscribers / maxSubs) * 100; break;
        case 'Vistas': value = (ch.totalViews / maxViews) * 100; break;
        case 'Frecuencia': value = Math.min(ch.videoCount / 6, 100); break;
        case 'Engagement': value = (ch.engagementRate / 10) * 100; break;
        case 'Ingresos': value = (ch.estimatedRevenue / maxRevenue) * 100; break;
        case 'Niche Score': value = 75; break;
      }
      entry[ch.name] = Math.round(value);
    });
    return entry;
  });

  const comparisonMetrics = [
    { label: 'Suscriptores', key: 'subscribers', format: formatNum },
    { label: 'Vistas Totales', key: 'totalViews', format: formatNum },
    { label: 'Videos', key: 'videoCount', format: (n: number) => n.toString() },
    { label: 'Engagement', key: 'engagementRate', format: (n: number) => `${n}%` },
    { label: 'Ingreso Est.', key: 'estimatedRevenue', format: (n: number) => `$${formatNum(n)}` },
    { label: 'Frecuencia', key: 'uploadFrequency', format: (n: string) => n },
  ];

  const getWinner = (metric: string) => {
    if (typeof selectedChannels[0][metric as keyof typeof selectedChannels[0]] === 'string') return -1;
    let maxIdx = 0;
    let maxVal = 0;
    selectedChannels.forEach((ch, i) => {
      const val = ch[metric as keyof typeof ch] as number;
      if (val > maxVal) { maxVal = val; maxIdx = i; }
    });
    return maxIdx;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Matriz de Competencia</h2>
        <p className="text-muted-foreground text-sm">Compara canales lado a lado con análisis visual</p>
      </div>

      {/* Channel Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {selectedChannels.map((ch, i) => (
              <Badge key={ch.id} className={cn('px-3 py-1.5 text-xs')} style={{ backgroundColor: COLORS[i] + '20', color: COLORS[i], borderColor: COLORS[i] + '40' }} variant="outline">
                {ch.avatar} {ch.name}
                {selectedIds.length > 2 && (
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => removeChannel(ch.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </Badge>
            ))}
            {selectedIds.length < 4 && (
              <Select onValueChange={addChannel}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Agregar canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.filter(c => !selectedIds.includes(c.id)).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.avatar} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Radar + Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary" />
                Comparación Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid className="opacity-30" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} />
                  {selectedChannels.map((ch, i) => (
                    <Radar key={ch.id} name={ch.name} dataKey={ch.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparación Detallada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-muted-foreground">Métrica</th>
                      {selectedChannels.map((ch, i) => (
                        <th key={ch.id} className="text-center p-2 font-medium" style={{ color: COLORS[i] }}>
                          {ch.name.length > 12 ? ch.name.substring(0, 12) + '...' : ch.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonMetrics.map((metric) => {
                      const winner = getWinner(metric.key);
                      return (
                        <tr key={metric.key} className="border-b border-border/30">
                          <td className="p-2 font-medium">{metric.label}</td>
                          {selectedChannels.map((ch, i) => {
                            const val = ch[metric.key as keyof typeof ch];
                            const isWinner = i === winner;
                            return (
                              <td key={ch.id} className={cn('text-center p-2', isWinner && 'font-bold text-emerald-500')}>
                                {isWinner && <Trophy className="w-3 h-3 inline mr-1" />}
                                {metric.format(val as never)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
