'use client';

import { useState, useCallback } from 'react';
import { useYouTubeApi } from '@/hooks/use-youtube-api';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Legend,
} from 'recharts';
import { Swords, Trophy, Plus, X, Search, Loader2, AlertCircle, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
const DIMENSIONS = ['Suscriptores', 'Vistas', 'Videos', 'Engagement', 'Ingresos', 'Score'];

interface YTChannel {
  id: string;
  name: string;
  thumbnail: string;
  avatar: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  avgViews: number;
  engagementRate: number;
  estimatedRevenue: number;
  niche: string;
}

export function CompetitorMatrixView() {
  const [search, setSearch] = useState('');
  const [ytChannels, setYtChannels] = useState<YTChannel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { status: aiStatus, check: recheckAI } = useAIStatus();
  const { searchVideos, getChannelStats } = useYouTubeApi();

  const searchChannels = useCallback(async () => {
    const query = search.trim();
    if (!query) return;
    setLoading(true);
    setError('');
    try {
      const searchData = await searchVideos(query, 'channel', 15);
      if (searchData.error) { setError(searchData.error); return; }
      const items = searchData.items || [];
      if (items.length === 0) { setError('No se encontraron canales'); return; }
      const channelIds = items.map((item: any) => item.snippet?.channelId).filter(Boolean).join(',');
      if (!channelIds) { setError('No se pudieron obtener IDs'); return; }
      const statsData = await getChannelStats(channelIds);
      if (statsData.error) { setError(statsData.error); return; }
      const channels: YTChannel[] = (statsData.items || []).map((ch: any) => {
        const subs = parseInt(ch.statistics?.subscriberCount || '0');
        const views = parseInt(ch.statistics?.viewCount || '0');
        const videos = parseInt(ch.statistics?.videoCount || '0');
        const avgViews = videos > 0 ? Math.round(views / videos) : 0;
        const engagement = subs > 0 ? ((avgViews / subs) * 100).toFixed(1) : '0';
        return {
          id: ch.id,
          name: ch.snippet?.title || 'Sin nombre',
          thumbnail: ch.snippet?.thumbnails?.default?.url || '',
          avatar: ch.snippet?.title?.[0]?.toUpperCase() || '?',
          subscribers: subs,
          totalViews: views,
          videoCount: videos,
          avgViews,
          engagementRate: parseFloat(engagement),
          estimatedRevenue: Math.round(avgViews * 0.015 * 30),
          niche: query,
        };
      });
      setYtChannels(channels);
      if (channels.length >= 2) {
        setSelectedIds([channels[0].id, channels[1].id]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar');
    } finally {
      setLoading(false);
    }
  }, [search, searchVideos, getChannelStats]);

  const selectedChannels = ytChannels.filter(c => selectedIds.includes(c.id));

  const addChannel = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeChannel = (id: string) => {
    if (selectedIds.length > 2) setSelectedIds(selectedIds.filter(i => i !== id));
  };

  const maxSubs = Math.max(...ytChannels.map(c => c.subscribers), 1);
  const maxViews = Math.max(...ytChannels.map(c => c.totalViews), 1);
  const maxRevenue = Math.max(...ytChannels.map(c => c.estimatedRevenue), 1);

  const radarData = DIMENSIONS.map(dim => {
    const entry: Record<string, string | number> = { dimension: dim };
    selectedChannels.forEach(ch => {
      let value = 0;
      switch (dim) {
        case 'Suscriptores': value = (ch.subscribers / maxSubs) * 100; break;
        case 'Vistas': value = (ch.totalViews / maxViews) * 100; break;
        case 'Videos': value = Math.min(ch.videoCount / 6, 100); break;
        case 'Engagement': value = (ch.engagementRate / 10) * 100; break;
        case 'Ingresos': value = (ch.estimatedRevenue / maxRevenue) * 100; break;
        case 'Score': value = 75; break;
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
  ];

  const getWinner = (metric: string) => {
    let maxIdx = 0; let maxVal = 0;
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
        <p className="text-muted-foreground text-sm">Compara canales de YouTube lado a lado</p>
      </div>

      <AIModeBanner available={aiStatus.available} loading={aiStatus.loading} error={aiStatus.error} onRetry={recheckAI} />

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar canales en YouTube..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchChannels()} className="pl-10" />
            </div>
            <Button onClick={searchChannels} disabled={loading || !search.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4 mr-1" />}
              Buscar
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400">{error}</p>
                <Button variant="outline" size="sm" className="text-xs h-6 mt-1" onClick={searchChannels}>Reintentar</Button>
              </div>
            </div>
          )}

          {selectedChannels.length >= 2 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {selectedChannels.map((ch, i) => (
                <Badge key={ch.id} className={cn('px-3 py-1.5 text-xs')} style={{ backgroundColor: COLORS[i] + '20', color: COLORS[i], borderColor: COLORS[i] + '40' }} variant="outline">
                  {ch.name.substring(0, 15)}{ch.name.length > 15 ? '...' : ''}
                  {selectedIds.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => removeChannel(ch.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </Badge>
              ))}
              {selectedIds.length < 4 && ytChannels.length > selectedIds.length && (
                <div className="relative">
                  <select
                    className="h-8 text-xs border rounded px-2 bg-background"
                    onChange={(e) => { if (e.target.value) addChannel(e.target.value); e.target.value = ''; }}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Agregar canal</option>
                    {ytChannels.filter(c => !selectedIds.includes(c.id)).map(c => (
                      <option key={c.id} value={c.id}>{c.name.substring(0, 25)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {ytChannels.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Busca canales en YouTube para compararlos</p>
            <p className="text-xs mt-1">Necesitas una YouTube API Key configurada en Settings</p>
          </CardContent>
        </Card>
      )}

      {selectedChannels.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Swords className="w-5 h-5 text-primary" />Comparación Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid className="opacity-30" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 8 }} />
                    {selectedChannels.map((ch, i) => (
                      <Radar key={ch.id} name={ch.name.substring(0, 15)} dataKey={ch.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Comparación Detallada</CardTitle></CardHeader>
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
      )}
    </div>
  );
}
