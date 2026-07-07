'use client';

import { useState, useEffect, useCallback } from 'react';
import { useYouTubeApi } from '@/hooks/use-youtube-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [ytChannels, setYtChannels] = useState<YouTubeChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<YouTubeChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const { searchVideos, getChannelStats, status } = useYouTubeApi();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Análisis de Canal</h2>
        <p className="text-muted-foreground text-sm">Analiza el rendimiento de cualquier canal de YouTube</p>
      </div>

      {!status.configured && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">YouTube API Key no configurada</p>
              <p className="text-xs text-muted-foreground mt-1">Configúrala en Settings para analizar canales.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar canal en YouTube..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchYouTubeChannels()} className="pl-10" disabled={!status.configured} />
        </div>
        <Button onClick={searchYouTubeChannels} disabled={loading || !search.trim() || !status.configured}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4 mr-1" />}
          Buscar
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
            <p className="text-sm text-muted-foreground">Buscando canales en YouTube...</p>
          </CardContent>
        </Card>
      )}

      {!ch && !loading && !error && ytChannels.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Busca un canal para analizar</p>
        </div>
      )}

      {ch && ytChannels.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto custom-scrollbar">
            {ytChannels.map(c => (
              <Button key={c.id} variant={selectedChannel?.id === c.id ? 'default' : 'outline'} className="w-full justify-start h-auto py-3 px-3" onClick={() => setSelectedChannel(c)}>
                <div className="flex items-center gap-2">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{c.avatar}</span>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-medium truncate max-w-[120px]">{c.name}</p>
                    <p className="text-[10px] opacity-70">{formatNum(c.subscribers)} subs</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {ch.thumbnail ? (
                      <img src={ch.thumbnail} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl shrink-0">{ch.avatar}</div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{ch.name}</h3>
                        <a href={`https://youtube.com/channel/${ch.id}`} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400"><ExternalLink className="w-4 h-4" /></a>
                      </div>
                      <p className="text-sm text-muted-foreground">{ch.niche}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{formatNum(subs)} suscriptores</Badge>
                        <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />{formatNum(totalViews)} vistas</Badge>
                        <Badge variant="outline"><Video className="w-3 h-3 mr-1" />{videoCount} videos</Badge>
                        {ch.publishedAt && (
                          <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Desde {new Date(ch.publishedAt).getFullYear()}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Views/Subs', value: `${viewsSubsRatio}%`, icon: TrendingUp, color: 'text-emerald-500' },
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

            {mounted && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Crecimiento de Suscriptores</CardTitle></CardHeader>
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
                  <CardHeader className="pb-2"><CardTitle className="text-base">Rendimiento por Video</CardTitle></CardHeader>
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

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Análisis FODA</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-1"><Award className="w-4 h-4" /> Fortalezas</h4>
                  {engagement > 6
                    ? ['Alto engagement de audiencia', 'Contenido consistente', 'Niche con crecimiento'].map((s, i) => <p key={i} className="text-xs text-muted-foreground py-1 pl-4">• {s}</p>)
                    : ['Base de suscriptores establecida', 'Contenido diversificado', 'Presencia consistente'].map((s, i) => <p key={i} className="text-xs text-muted-foreground py-1 pl-4">• {s}</p>)
                  }
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Oportunidades</h4>
                  {['Expandir formatos de contenido', 'Diversificar fuentes de ingreso', 'Colaboraciones con otros canales'].map((w, i) => <p key={i} className="text-xs text-muted-foreground py-1 pl-4">• {w}</p>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
