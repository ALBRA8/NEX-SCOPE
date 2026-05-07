'use client';

import { useState } from 'react';
import { channels } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Search, Users, Eye, Video, Calendar, DollarSign,
  TrendingUp, Award, AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ChannelAnalyzerView() {
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);

  const filteredChannels = search
    ? channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.niche.toLowerCase().includes(search.toLowerCase()))
    : channels;

  const ch = selectedChannel;
  const growthData = ch.growthHistory.map((v, i) => ({ mes: months[i], suscriptores: v }));
  const topVideosData = ch.topVideos.map(v => ({
    título: v.title.length > 20 ? v.title.substring(0, 20) + '...' : v.title,
    vistas: v.views,
  }));

  const viewsSubsRatio = ((ch.avgViews / ch.subscribers) * 100).toFixed(1);
  const strengths = ['Alto engagement', 'Contenido consistente', 'Niche en crecimiento'];
  const weaknesses = ['Dependencia de un formato', 'Frecuencia variable', 'Poca diversificación'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Análisis de Canal</h2>
        <p className="text-muted-foreground text-sm">Analiza el rendimiento de cualquier canal de YouTube</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar canal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Channel List */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto custom-scrollbar">
          {filteredChannels.map(c => (
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
          ))}
        </div>

        {/* Channel Detail */}
        <div className="lg:col-span-3 space-y-4">
          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                    {ch.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{ch.name}</h3>
                    <p className="text-sm text-muted-foreground">{ch.niche}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{formatNum(ch.subscribers)} suscriptores</Badge>
                      <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />{formatNum(ch.totalViews)} vistas</Badge>
                      <Badge variant="outline"><Video className="w-3 h-3 mr-1" />{ch.videoCount} videos</Badge>
                      <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Desde {ch.joinDate}</Badge>
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
              { label: 'Frecuencia', value: ch.uploadFrequency, icon: Calendar, color: 'text-amber-500' },
              { label: 'Engagement', value: `${ch.engagementRate}%`, icon: Award, color: 'text-violet-500' },
              { label: 'Ingreso Est.', value: `$${formatNum(ch.estimatedRevenue)}/mes`, icon: DollarSign, color: 'text-cyan-500' },
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

          {/* Top Videos + Strengths/Weaknesses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ch.topVideos.map((v, i) => (
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
                  {strengths.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground py-1 pl-4">• {s}</p>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Debilidades
                  </h4>
                  {weaknesses.map((w, i) => (
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
