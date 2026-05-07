'use client';

import { useState, useEffect, useCallback } from 'react';
import { channels as mockChannels } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useYouTubeApi } from '@/hooks/use-youtube-api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Search, Users, Eye, Video, Calendar, DollarSign,
  TrendingUp, Award, AlertTriangle, Loader2, Youtube, ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [searchMode, setSearchMode] = useState<'demo' | 'youtube'>('demo');
  const [selectedChannel, setSelectedChannel] = useState(mockChannels[0]);
  const [ytChannels, setYtChannels] = useState<YouTubeChannel[]>([]);
  const [selectedYtChannel, setSelectedYtChannel] = useState<YouTubeChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const { searchVideos, getChannelStats, status } = useYouTubeApi();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Search YouTube channels
  const searchYouTubeChannels = useCallback(async () => {
    const query = search.trim();
    if (!query) return;

    setLoading(true);
    setError('');
    setSearchMode('youtube');

    try {
      // Search for channels
      const searchData = await searchVideos(query, 'channel', 15);

      if (searchData.error) {
        setError(searchData.error);
        return;
      }

      const items = searchData.items || [];
      if (items.length === 0) {
        setError('No se encontraron canales');
        return;
      }

      // Get stats for each channel
      const channelIds = items.map((item: any) => item.snippet?.channelId).filter(Boolean).join(',');
      if (!channelIds) {
        setError('No se pudieron obtener IDs de canales');
        return;
      }

      const statsData = await getChannelStats(channelIds);
      if (statsData.error) {
        setError(statsData.error);
        return;
      }

      const channels: YouTubeChannel[] = (statsData.items || []).map((ch: any) => {
        const subs = parseInt(ch.statistics?.subscriberCount || '0');
        const views = parseInt(ch.statistics?.viewCount || '0');
        const videos = parseInt(ch.statistics?.videoCount || '0');
        const avgViews = videos > 0 ? Math.round(views / videos) : 0;
        const engagement = subs > 0 ? ((avgViews / subs) * 100).toFixed(1) : '0';
        const estimatedRevenue = Math.round(avgViews * 0.015 * 30); // rough estimate

        return {
          id: ch.id,
          name: ch.snippet?.title || 'Sin nombre',
          avatar: ch.snippet?.title?.[0]?.toUpperCase() || '?',
          subscribers: subs,
          totalViews: views,
          videoCount: videos,
          avgViews,
          engagementRate: parseFloat(engagement),
          estimatedRevenue,
          niche: search,
          description: ch.snippet?.description || '',
          thumbnail: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || '',
          publishedAt: ch.snippet?.publishedAt || '',
        };
      });

      setYtChannels(channels);
      if (channels.length > 0) {
        setSelectedYtChannel(channels[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar canales');
    } finally {
      setLoading(false);
    }
  }, [search, searchVideos, getChannelStats]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status.configured && status.valid) {
      searchYouTubeChannels();
    }
  };

  // Display channel based on mode
  const displayChannel = searchMode === 'youtube' ? selectedYtChannel : selectedChannel;

  // Generate chart data for YouTube channel
  const getYtGrowthData = () => {
    if (!selectedYtChannel) return [];
    const base = Math.round(selectedYtChannel.subscribers * 0.5);
    const rate = 1 + (Math.random() * 0.3);
    return months.map((mes, i) => ({
      mes,
      suscriptores: Math.round(base * Math.pow(rate, i / 12)),
    }));
  };

  const getYtTopVideos = () => {
    if (!selectedYtChannel) return [];
    // Generate estimated video performance data
    const baseViews = selectedYtChannel.avgViews;
    return Array.from({ length: 5 }, (_, i) => ({
      título: `Video ${i + 1}`,
      vistas: Math.round(baseViews * (1.5 - i * 0.2 + Math.random() * 0.3)),
    }));
  };

  const ch = displayChannel;
  if (!ch) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Busca un canal para analizar</p>
      </div>
    );
  }

  // Common metrics
  const isYouTube = searchMode === 'youtube';
  const subs = isYouTube ? (ch as YouTubeChannel).subscribers : (ch as any).subscribers;
  const totalViews = isYouTube ? (ch as YouTubeChannel).totalViews : (ch as any).totalViews;
  const videoCount = isYouTube ? (ch as YouTubeChannel).videoCount : (ch as any).videoCount;
  const avgViews = isYouTube ? (ch as YouTubeChannel).avgViews : (ch as any).avgViews;
  const engagement = isYouTube ? (ch as YouTubeChannel).engagementRate : (ch as any).engagementRate;
  const revenue = isYouTube ? (ch as YouTubeChannel).estimatedRevenue : (ch as any).estimatedRevenue;
  const viewsSubsRatio = subs > 0 ? ((avgViews / subs) * 100).toFixed(1) : '0';

  const growthData = isYouTube ? getYtGrowthData() : (ch as any).growthHistory?.map((v: number, i: number) => ({ mes: months[i], suscriptores: v })) || [];
  const topVideosData = isYouTube ? getYtTopVideos() : (ch as any).topVideos?.map((v: any) => ({
    título: v.title.length > 20 ? v.title.substring(0, 20) + '...' : v.title,
    vistas: v.views,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Análisis de Canal</h2>
        <p className="text-muted-foreground text-sm">Analiza el rendimiento de cualquier canal de YouTube</p>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canal en YouTube..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button
          onClick={searchYouTubeChannels}
          disabled={loading || !search.trim()}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4 mr-1" />}
          Buscar
        </Button>
        {searchMode === 'youtube' && ytChannels.length > 0 && (
          <Button variant="outline" onClick={() => { setSearchMode('demo'); setYtChannels([]); setSelectedYtChannel(null); }}>
            📊 Demo
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={searchYouTubeChannels}>Reintentar</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Channel List */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto custom-scrollbar">
          {searchMode === 'youtube' ? (
            ytChannels.map(c => (
              <Button
                key={c.id}
                variant={selectedYtChannel?.id === c.id ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-3 px-3"
                onClick={() => setSelectedYtChannel(c)}
              >
                <div className="flex items-center gap-2">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {c.avatar}
                    </span>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-medium truncate max-w-[120px]">{c.name}</p>
                    <p className="text-[10px] opacity-70">{formatNum(c.subscribers)} subs</p>
                  </div>
                </div>
              </Button>
            ))
          ) : (
            mockChannels.map(c => (
              <Button
                key={c.id}
                variant={selectedChannel.id === c.id ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-3 px-3"
                onClick={() => setSelectedChannel(c)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.avatar}</span>
                  <div className="text-left">
                    <p className="text-xs font-medium truncate max-w-[120px]">{c.name}</p>
                    <p className="text-[10px] opacity-70">{formatNum(c.subscribers)} subs</p>
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>

        {/* Channel Detail */}
        <div className="lg:col-span-3 space-y-4">
          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {isYouTube && (ch as YouTubeChannel).thumbnail ? (
                    <img
                      src={(ch as YouTubeChannel).thumbnail}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                      {(ch as any).avatar || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{(ch as any).name}</h3>
                      {isYouTube && (
                        <a
                          href={`https://youtube.com/channel/${(ch as YouTubeChannel).id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-500 hover:text-red-400"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{(ch as any).niche}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{formatNum(subs)} suscriptores</Badge>
                      <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />{formatNum(totalViews)} vistas</Badge>
                      <Badge variant="outline"><Video className="w-3 h-3 mr-1" />{videoCount} videos</Badge>
                      {(ch as any).joinDate && (
                        <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Desde {(ch as any).joinDate}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Views/Subs Ratio', value: `${viewsSubsRatio}%`, icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Videos', value: `${videoCount}`, icon: Video, color: 'text-amber-500' },
              { label: 'Engagement', value: `${engagement}%`, icon: Award, color: 'text-violet-500' },
              { label: 'Ingreso Est.', value: `$${formatNum(revenue)}/mes`, icon: DollarSign, color: 'text-cyan-500' },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card>
                  <CardContent className="p-4 text-center">
                    <m.icon className={cn('w-5 h-5 mx-auto mb-2', m.color)} />
                    <p className="text-lg font-bold">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          {mounted && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Crecimiento de Suscriptores</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="suscriptores" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Rendimiento por Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topVideosData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="título" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [formatNum(v), 'Vistas']} />
                      <Bar dataKey="vistas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Videos + Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {!isYouTube && (ch as any).topVideos?.map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                        <span className="truncate text-xs">{v.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatNum(v.views)}</span>
                        <Badge variant="outline" className="text-[10px]">{v.engagement}%</Badge>
                      </div>
                    </div>
                  ))}
                  {isYouTube && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Los datos de videos se mostrarán cuando implementes la búsqueda de videos por canal
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Análisis FODA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-1">
                    <Award className="w-4 h-4" /> Fortalezas
                  </h4>
                  {engagement > 6 ? (
                    ['Alto engagement de audiencia', 'Contenido consistente', 'Niche con crecimiento'].map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground py-1 pl-4">• {s}</p>
                    ))
                  ) : (
                    ['Base de suscriptores establecida', 'Contenido diversificado', 'Presencia consistente'].map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground py-1 pl-4">• {s}</p>
                    ))
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Oportunidades
                  </h4>
                  {['Expandir formatos de contenido', 'Diversificar fuentes de ingreso', 'Colaboraciones con otros canales'].map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground py-1 pl-4">• {w}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
