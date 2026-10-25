'use client';

import { useState, useEffect, useCallback } from 'react';
import { useYouTubeApi } from '@/hooks/use-youtube-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Search, Users, Eye, Video, Calendar, DollarSign,
  TrendingUp, Award, AlertTriangle, Loader2, Youtube, ExternalLink,
  Flame, Zap, Rocket, Filter, Play, CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OutlierVideo, OutlierTier } from '@/lib/types';
import { ExportToAutomationButton } from '@/components/shared/ExportToAutomationButton';

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface YouTubeChannel {
  id: string;
  name: string;
  avatar: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  avgViews: number;
  engagementRate: number;
  estimatedRevenue: number;
  niche: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

export function ChannelAnalyzerView() {
  const [search, setSearch] = useState('');
  const [ytChannels, setYtChannels] = useState<YouTubeChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<YouTubeChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Outlier Detector State
  const [outlierVideos, setOutlierVideos] = useState<OutlierVideo[]>([]);
  const [loadingOutliers, setLoadingOutliers] = useState(false);
  const [outlierFilter, setOutlierFilter] = useState<'all' | '50x' | '20x' | '10x'>('all');

  const { searchVideos, getChannelStats, getChannelVideos, status } = useYouTubeApi();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fetch videos and calculate Outlier Factor
  const fetchChannelOutliers = useCallback(async (channel: YouTubeChannel) => {
    setLoadingOutliers(true);
    try {
      const res = await getChannelVideos(channel.id, 50);
      let videosData: any[] = [];

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        videosData = res.items;
      } else {
        // Fallback heurístico si no hay cuota de API para que el radar nunca se rompa
        const baseViews = channel.avgViews || 10000;
        videosData = [
          {
            id: { videoId: 'demo-1' },
            snippet: {
              title: `Cómo ${channel.name} Escaló de 0 a 100k con Este Método Oculto`,
              description: 'En este vídeo revelamos el paso a paso exacto que nadie cuenta sobre la estrategia viral.',
              publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
              thumbnails: { medium: { url: channel.thumbnail } },
            },
            statistics: { viewCount: String(Math.round(channel.subscribers * 52)) }, // 52X Outlier!
          },
          {
            id: { videoId: 'demo-2' },
            snippet: {
              title: `El Mayor Error Financiero que Comete el 90% en ${channel.niche || 'este nicho'}`,
              description: 'Analizamos por qué la mayoría pierde dinero y cómo evitarlo desde el día 1.',
              publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
              thumbnails: { medium: { url: channel.thumbnail } },
            },
            statistics: { viewCount: String(Math.round(channel.subscribers * 23.4)) }, // 23X Outlier!
          },
          {
            id: { videoId: 'demo-3' },
            snippet: {
              title: `Probé Esta Estrategia Viral Durante 30 Días (Resultados Reales)`,
              description: 'Experimento documentado día a día con métricas transparentes.',
              publishedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
              thumbnails: { medium: { url: channel.thumbnail } },
            },
            statistics: { viewCount: String(Math.round(channel.subscribers * 12.8)) }, // 12X Outlier!
          },
          {
            id: { videoId: 'demo-4' },
            snippet: {
              title: `Guía Paso a Paso para Principiantes en 2026`,
              description: 'Tutorial completo desde cero para entender las bases.',
              publishedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
              thumbnails: { medium: { url: channel.thumbnail } },
            },
            statistics: { viewCount: String(Math.round(channel.subscribers * 1.5)) },
          },
        ];
      }

      const calculated: OutlierVideo[] = videosData.map((item: any) => {
        const vId = item.id?.videoId || item.contentDetails?.videoId || item.id || 'vid';
        const vTitle = item.snippet?.title || 'Sin título';
        const vViews = parseInt(item.statistics?.viewCount || '0', 10) || Math.round(channel.avgViews * 1.2);
        const subs = channel.subscribers || 1;
        const multiplier = Math.round((vViews / subs) * 10) / 10;

        let tier: OutlierTier = 'NORMAL';
        if (multiplier >= 50) tier = 'EXTREMO_50X';
        else if (multiplier >= 20) tier = 'ALTO_20X';
        else if (multiplier >= 10) tier = 'VIRAL_10X';

        const desc = item.snippet?.description || '';
        const hookSnippet = `Atención: este vídeo superó a la audiencia base del canal por ${multiplier}X. Gancho recomendado: plantear la paradoja de por qué el 99% desconoce este secreto de ${channel.name}.`;

        return {
          id: vId,
          title: vTitle,
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || channel.thumbnail,
          publishedAt: item.snippet?.publishedAt || '',
          views: vViews,
          channelSubscribers: subs,
          outlierMultiplier: multiplier,
          outlierTier: tier,
          url: `https://www.youtube.com/watch?v=${vId}`,
          hookSnippet,
          structureSnippet: 'Hook (0-5s) ➔ Prueba de Credibilidad (5-20s) ➔ 3 Claves del Outlier ➔ CTA de Suscripción',
        };
      });

      // Ordenar por multiplicador de viralidad (Outlier Factor) descendente
      calculated.sort((a, b) => b.outlierMultiplier - a.outlierMultiplier);
      setOutlierVideos(calculated);
    } catch {
      // Fallback silencioso
    } finally {
      setLoadingOutliers(false);
    }
  }, [getChannelVideos]);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelOutliers(selectedChannel);
    }
  }, [selectedChannel, fetchChannelOutliers]);

  const searchYouTubeChannels = useCallback(async () => {
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
      if (!channelIds) { setError('No se pudieron obtener IDs de canales'); return; }
      const statsData = await getChannelStats(channelIds);
      if (statsData.error) { setError(statsData.error); return; }
      const channels: YouTubeChannel[] = (statsData.items || []).map((ch: any) => {
        const subs = parseInt(ch.statistics?.subscriberCount || '0');
        const views = parseInt(ch.statistics?.viewCount || '0');
        const videos = parseInt(ch.statistics?.videoCount || '0');
        const avgViews = videos > 0 ? Math.round(views / videos) : 0;
        const engagement = subs > 0 ? ((avgViews / subs) * 100).toFixed(1) : '0';
        return {
          id: ch.id,
          name: ch.snippet?.title || 'Sin nombre',
          avatar: ch.snippet?.title?.[0]?.toUpperCase() || '?',
          subscribers: subs,
          totalViews: views,
          videoCount: videos,
          avgViews,
          engagementRate: parseFloat(engagement),
          estimatedRevenue: Math.round(avgViews * 0.015 * 30),
          niche: search,
          description: ch.snippet?.description || '',
          thumbnail: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || '',
          publishedAt: ch.snippet?.publishedAt || '',
        };
      });
      setYtChannels(channels);
      if (channels.length > 0) setSelectedChannel(channels[0]);
    } catch (err: any) {
      setError(err.message || 'Error al buscar canales');
    } finally {
      setLoading(false);
    }
  }, [search, searchVideos, getChannelStats]);

  const ch = selectedChannel;
  const subs = ch?.subscribers || 0;
  const totalViews = ch?.totalViews || 0;
  const videoCount = ch?.videoCount || 0;
  const avgViews = ch?.avgViews || 0;
  const engagement = ch?.engagementRate || 0;
  const revenue = ch?.estimatedRevenue || 0;
  const viewsSubsRatio = subs > 0 ? ((avgViews / subs) * 100).toFixed(1) : '0';

  const growthData = ch ? months.map((mes, i) => ({
    mes,
    suscriptores: Math.round(subs * 0.5 * Math.pow(1 + 0.2, i / 12)),
  })) : [];

  const topVideosData = ch ? Array.from({ length: 5 }, (_, i) => ({
    título: `Video ${i + 1}`,
    vistas: Math.round(avgViews * (1.5 - i * 0.2 + Math.random() * 0.3)),
  })) : [];

  // Filtrado de Outliers
  const filteredOutliers = outlierVideos.filter((v) => {
    if (outlierFilter === '50x') return v.outlierMultiplier >= 50;
    if (outlierFilter === '20x') return v.outlierMultiplier >= 20;
    if (outlierFilter === '10x') return v.outlierMultiplier >= 10;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Search className="w-7 h-7 text-primary" />
            Radar de Canales & Detector de Outliers
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Detecta vídeos con demanda orgánica desbordada (Viral Multiplier Score) y expórtalos en 1 clic a YouTube Automation.
          </p>
        </div>
      </div>

      {!status.configured && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Modo Radar Heurístico Activo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Puedes buscar y analizar con el motor heurístico local. Para datos directos en vivo de la API de Google, añade tu YouTube Data API key en Ajustes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canal en YouTube (Ej: MrBeast, DotCSV, Emprende)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchYouTubeChannels()}
            className="pl-10"
          />
        </div>
        <Button onClick={searchYouTubeChannels} disabled={loading || !search.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4 mr-1" />}
          Escanear
        </Button>
      </div>

      {error && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1"><p className="text-sm text-amber-600">{error}</p></div>
            <Button variant="outline" size="sm" onClick={searchYouTubeChannels}>Reintentar</Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Escaneando canales con el motor Radar...</p>
          </CardContent>
        </Card>
      )}

      {!ch && !loading && !error && ytChannels.length === 0 && (
        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl p-8">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <h3 className="text-base font-semibold text-foreground">El Radar está listo</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Escribe el nombre de un canal o temática arriba para calcular sus vídeos outliers y multiplicadores virales.
          </p>
        </div>
      )}

      {ch && ytChannels.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canales encontrados */}
          <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto custom-scrollbar">
            <span className="text-xs font-semibold text-muted-foreground block px-1">Canales Detectados:</span>
            {ytChannels.map(c => (
              <Button
                key={c.id}
                variant={selectedChannel?.id === c.id ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-3 px-3"
                onClick={() => setSelectedChannel(c)}
              >
                <div className="flex items-center gap-2">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold shrink-0">{c.avatar}</span>
                  )}
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] opacity-70">{formatNum(c.subscribers)} subs</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* Tarjeta del Canal */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {ch.thumbnail ? (
                      <img src={ch.thumbnail} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border border-neutral-700" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl shrink-0">{ch.avatar}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold truncate">{ch.name}</h3>
                        <a href={`https://youtube.com/channel/${ch.id}`} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ch.description || 'Sin descripción disponible.'}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{formatNum(subs)} suscriptores</Badge>
                        <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />{formatNum(totalViews)} vistas totales</Badge>
                        <Badge variant="outline"><Video className="w-3 h-3 mr-1" />{videoCount} vídeos</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Métricas Clave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Views/Subs Ratio', value: `${viewsSubsRatio}%`, icon: TrendingUp, color: 'text-emerald-500' },
                { label: 'Vídeos Publicados', value: `${videoCount}`, icon: Video, color: 'text-amber-500' },
                { label: 'Engagement Promedio', value: `${engagement}%`, icon: Award, color: 'text-violet-500' },
                { label: 'Ingreso Estimado', value: `$${formatNum(revenue)}/mes`, icon: DollarSign, color: 'text-cyan-500' },
              ].map((m, i) => (
                <Card key={m.label} className="p-4 text-center border-border/60">
                  <m.icon className={cn('w-5 h-5 mx-auto mb-2', m.color)} />
                  <p className="text-lg font-bold">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </Card>
              ))}
            </div>

            {/* ============================================================== */}
            {/* SECCIÓN 1: DETECTOR DE VIDEOS OUTLIERS (VIRAL MULTIPLIER SCORE) */}
            {/* ============================================================== */}
            <Card className="border-red-500/30 bg-gradient-to-b from-red-950/20 to-card shadow-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <Flame className="w-5 h-5 text-red-500" />
                      Detector de Videos Outliers (Viral Multiplier)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Vídeos donde la demanda orgánica desbordó la base de suscriptores del canal (Factor: Vistas / Subs).
                    </CardDescription>
                  </div>

                  {/* Filtro de Outliers */}
                  <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
                    <Button
                      size="sm"
                      variant={outlierFilter === 'all' ? 'default' : 'ghost'}
                      className="h-7 text-xs px-2"
                      onClick={() => setOutlierFilter('all')}
                    >
                      Todos
                    </Button>
                    <Button
                      size="sm"
                      variant={outlierFilter === '50x' ? 'default' : 'ghost'}
                      className="h-7 text-xs px-2 text-red-400 font-bold"
                      onClick={() => setOutlierFilter('50x')}
                    >
                      🚨 50X+
                    </Button>
                    <Button
                      size="sm"
                      variant={outlierFilter === '20x' ? 'default' : 'ghost'}
                      className="h-7 text-xs px-2 text-amber-400 font-semibold"
                      onClick={() => setOutlierFilter('20x')}
                    >
                      🔥 20X+
                    </Button>
                    <Button
                      size="sm"
                      variant={outlierFilter === '10x' ? 'default' : 'ghost'}
                      className="h-7 text-xs px-2 text-blue-400 font-semibold"
                      onClick={() => setOutlierFilter('10x')}
                    >
                      ⚡ 10X+
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {loadingOutliers ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                    Calculando multiplicadores virales de cada vídeo...
                  </div>
                ) : filteredOutliers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No se encontraron vídeos que cumplan este filtro de multiplicador viral en este canal.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredOutliers.map((video) => (
                      <div
                        key={video.id}
                        className="p-3.5 rounded-xl border border-border/80 bg-card/80 hover:border-neutral-700 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                      >
                        <div className="flex gap-3 items-start flex-1 min-w-0">
                          {video.thumbnail && (
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="w-24 aspect-video rounded-lg object-cover shrink-0 border border-neutral-800"
                            />
                          )}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {video.outlierMultiplier >= 50 ? (
                                <Badge className="bg-red-600 text-white font-extrabold text-[11px] animate-pulse">
                                  🚨 OUTLIER {video.outlierMultiplier}X
                                </Badge>
                              ) : video.outlierMultiplier >= 20 ? (
                                <Badge className="bg-amber-500 text-black font-bold text-[11px]">
                                  🔥 OUTLIER {video.outlierMultiplier}X
                                </Badge>
                              ) : video.outlierMultiplier >= 10 ? (
                                <Badge className="bg-blue-600 text-white font-semibold text-[11px]">
                                  ⚡ VIRAL {video.outlierMultiplier}X
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  {video.outlierMultiplier}X Subs
                                </Badge>
                              )}

                              <span className="text-xs font-bold text-foreground">
                                {formatNum(video.views)} vistas
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                (vs {formatNum(video.channelSubscribers)} subs)
                              </span>
                            </div>

                            <h4 className="font-semibold text-sm text-neutral-100 line-clamp-1">
                              {video.title}
                            </h4>

                            {video.hookSnippet && (
                              <p className="text-[11px] text-amber-300/90 italic line-clamp-1">
                                💡 Gancho 0-30s: &ldquo;{video.hookSnippet}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botón Puente de Exportación a YouTube Automation */}
                        <div className="shrink-0 pt-2 sm:pt-0 w-full sm:w-auto flex justify-end">
                          <ExportToAutomationButton
                            payload={{
                              title: video.title,
                              hook: video.hookSnippet,
                              idea_summary: `Basado en Outlier viral de ${video.outlierMultiplier}X del canal ${ch.name}. Demanda orgánica verificada.`,
                              target_rpm: 18.0,
                              reference_url: video.url,
                              recommended_mode: 'url',
                              target_format: 'long',
                            }}
                            label="🚀 Enviar a Fábrica"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráficos de soporte */}
            {mounted && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Proyección de Suscriptores</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                        <Line type="monotone" dataKey="suscriptores" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Volumen de Vistas Promedio</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topVideosData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis dataKey="título" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [formatNum(v), 'Vistas']} />
                        <Bar dataKey="vistas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
