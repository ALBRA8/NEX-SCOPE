'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { StatCard } from '@/components/shared/StatCard';
import { ApiKeyStatus } from '@/components/ApiKeyStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, DollarSign, Users, ArrowRight, Loader2, AlertCircle, Zap, Search } from 'lucide-react';

interface DashboardData {
  stats: { savedNiches: number; savedChannels: number; savedPlans: number; chatMessages: number };
  recentNiches: { id: string; nicheId: string; name: string; category: string; nicheScore: number; createdAt: string }[];
  recentChannels: { id: string; channelId: string; name: string; subscribers: number; createdAt: string }[];
  recentPlans: { id: string; niche: string; audience: string; createdAt: string }[];
}

export function DashboardView() {
  const { setActiveView } = useAppStore();
  const { status: aiStatus, check: recheckAI } = useAIStatus();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) {
          setError('Error al cargar datos del dashboard.');
          return;
        }
        const d = await res.json();
        setData(d);
      } catch {
        setError('Error de red al cargar dashboard.');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const quickActions = [
    { label: 'Buscar Nichos', icon: Search, view: 'niche-finder' as const, desc: 'Descubre nichos rentables' },
    { label: 'Ver Tendencias', icon: TrendingUp, view: 'trends' as const, desc: 'Tendencias actuales' },
    { label: 'Analizar Canal', icon: Users, view: 'channel-analyzer' as const, desc: 'Analiza cualquier canal' },
    { label: 'Asistente IA', icon: Zap, view: 'ai-chat' as const, desc: 'Pregunta a la IA' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Resumen general del análisis de nichos de YouTube</p>
      </div>

      <ApiKeyStatus />
      <AIModeBanner available={aiStatus.available} loading={aiStatus.loading} error={aiStatus.error} onRetry={recheckAI} />

      {loading && (
        <Card>
          <CardContent className="p-8 flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando tus datos...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Error al cargar datos</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Nichos Guardados" value={data.stats.savedNiches} icon={Target} trend={0} description="En tu cuenta" />
            <StatCard title="Canales Guardados" value={data.stats.savedChannels} icon={Users} trend={0} description="En tu cuenta" />
            <StatCard title="Planes Guardados" value={data.stats.savedPlans} icon={DollarSign} trend={0} description="De contenido" />
            <StatCard title="Mensajes Chat" value={data.stats.chatMessages} icon={Zap} trend={0} description="Historial" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Nichos Guardados</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentNiches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aún no has guardado nichos</p>
                      <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => setActiveView('niche-finder')}>
                        Buscar nichos
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.recentNiches.map((niche) => (
                        <div key={niche.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Target className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{niche.name}</p>
                              <p className="text-xs text-muted-foreground">{niche.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-500">{niche.nicheScore}</p>
                            <p className="text-[10px] text-muted-foreground">Score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quickActions.map((action) => (
                      <Button key={action.view} variant="outline" className="w-full justify-start h-auto py-3 px-4" onClick={() => setActiveView(action.view)}>
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
        </>
      )}
    </div>
  );
}
