'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { niches, channels, trendData } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';
import { ApiKeyStatus } from '@/components/ApiKeyStatus';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target, TrendingUp, DollarSign, Users,
  Search, Zap, ArrowRight,
} from 'lucide-react';

export function DashboardView() {
  const { setActiveView } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready for Recharts
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const trendingNiches = niches.filter(n => n.trending).length;
  const avgRPM = (niches.reduce((a, n) => a + n.estimatedRPM, 0) / niches.length).toFixed(2);

  const nicheScores = [...niches]
    .sort((a, b) => b.nicheScore - a.nicheScore)
    .slice(0, 8)
    .map(n => ({ name: n.name.length > 15 ? n.name.substring(0, 15) + '...' : n.name, puntuacion: n.nicheScore }));

  const recentNiches = niches.slice(0, 5);

  const quickActions = [
    { label: 'Buscar Nichos', icon: Search, view: 'niche-finder' as const, desc: 'Descubre nichos rentables' },
    { label: 'Ver Tendencias', icon: TrendingUp, view: 'trends' as const, desc: 'Tendencias actuales' },
    { label: 'Analizar Canal', icon: Users, view: 'channel-analyzer' as const, desc: 'Analiza cualquier canal' },
    { label: 'Asistente IA', icon: Zap, view: 'ai-chat' as const, desc: 'Pregunta a la IA' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground text-sm">Resumen general del análisis de nichos de YouTube</p>
        </div>
      </div>

      {/* API Key Status */}
      <ApiKeyStatus />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nichos Analizados"
          value={niches.length}
          icon={Target}
          trend={12}
          description="+3 esta semana"
        />
        <StatCard
          title="Nichos en Tendencia"
          value={trendingNiches}
          icon={TrendingUp}
          trend={8}
          description="Activos ahora"
        />
        <StatCard
          title="RPM Promedio"
          value={`$${avgRPM}`}
          icon={DollarSign}
          trend={5}
          description="Todos los nichos"
        />
        <StatCard
          title="Canales Monitoreados"
          value={channels.length}
          icon={Users}
          trend={15}
          description="+2 nuevos"
        />
      </div>

      {/* Charts Row - Only render after mount to avoid Recharts SSR issues */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nichos más Rentables</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={nicheScores} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}/100`, 'Puntuación']}
                  />
                  <Bar dataKey="puntuacion" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendencias de Crecimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Tecnología" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Finanzas" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Gaming" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Educación" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart loading placeholder */}
      {!mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Nichos más Rentables</CardTitle></CardHeader>
            <CardContent><div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Cargando gráfico...</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tendencias de Crecimiento</CardTitle></CardHeader>
            <CardContent><div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Cargando gráfico...</div></CardContent>
          </Card>
        </div>
      )}

      {/* Recent Niches Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent niches */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nichos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentNiches.map((niche) => (
                  <div key={niche.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{niche.name}</p>
                        <p className="text-xs text-muted-foreground">{niche.category} · RPM ${niche.estimatedRPM}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={niche.trending ? 'default' : 'secondary'} className="text-[10px]">
                        {niche.trending ? '🔥 Tendencia' : 'Estable'}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-500">{niche.nicheScore}</p>
                        <p className="text-[10px] text-muted-foreground">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.view}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 px-4"
                    onClick={() => setActiveView(action.view)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <action.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
