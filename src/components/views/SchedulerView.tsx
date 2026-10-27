'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { useAIStatus } from '@/hooks/use-ai-status';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarClock,
  Zap,
  Play,
  RotateCw,
  Clock,
  CheckCircle2,
  Bell,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  Radio,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function SchedulerView() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningCycle, setRunningCycle] = useState<boolean>(false);
  const [lastCycleResult, setLastCycleResult] = useState<any>(null);

  const { status: aiStatus } = useAIStatus();
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/scheduler');
      const data = await res.json();
      if (data.ok && data.config) {
        setConfig(data.config);
      }
    } catch (err: any) {
      toast({
        title: 'Error al consultar piloto automático',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const toggleScheduler = async () => {
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.config);
        toast({
          title: data.config.enabled ? '¡Piloto Automático ACTIVADO!' : 'Piloto Automático en PAUSA',
          description: data.config.enabled
            ? 'El radar escaneará y producirá videos según la frecuencia establecida.'
            : 'Las tareas programadas han sido detenidas.',
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const runManualCycle = async () => {
    setRunningCycle(true);
    try {
      const res = await fetch('/api/scheduler/run-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: config?.preferred_niche || 'High RPM' }),
      });
      const data = await res.json();
      if (data.ok) {
        setLastCycleResult(data);
        toast({
          title: '🎉 ¡Ciclo Autónomo Completado con Éxito!',
          description: `Oportunidad: ${data.opportunity.title}`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error en ciclo autónomo',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setRunningCycle(false);
    }
  };

  const runAffiliateCycle = async () => {
    setRunningCycle(true);
    try {
      const res = await fetch('/api/scheduler/run-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'affiliate' }),
      });
      const data = await res.json();
      if (data.ok) {
        setLastCycleResult(data);
        toast({
          title: '🎉 ¡Lote de Afiliados Encolado con Éxito!',
          description: `Oferta JVZoo: ${data.opportunity.title}`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error al lanzar lote de afiliados',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setRunningCycle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner */}
      <AIModeBanner
        aiStatus={aiStatus}
        customTitle="Piloto Automático 24/7 (Overnight Autonomous Factory)"
        customDescription="Escaner continuo que detecta las oportunidades virales más rentables en NEX-SCOPE y las envía a YouTube Automation para que amanezcas con tus videos listos."
      />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Fábrica en Piloto Automático</h2>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              INT-069
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatización total: búsqueda de nicho, selección de gancho y envío a fábrica sin intervención humana.
          </p>
        </div>

        {/* Global Toggle & Quick Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/60 border border-border/60">
            <span className="text-xs font-semibold text-muted-foreground">
              {config?.enabled ? '🟢 ACTIVO' : '⚪ EN PAUSA'}
            </span>
            <Switch checked={config?.enabled || false} onCheckedChange={toggleScheduler} />
          </div>

          <Button
            size="sm"
            onClick={runManualCycle}
            disabled={runningCycle}
            className="h-9 gap-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
          >
            {runningCycle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            Ejecutar Ciclo
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={runAffiliateCycle}
            disabled={runningCycle}
            className="h-9 gap-1.5 font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
          >
            {runningCycle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            Lote JVZoo Overnight
          </Button>
        </div>
      </div>

      {/* Main Grid: Control Panel + Live Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration & Frequency */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border/80 bg-card/70 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-emerald-400" /> Parámetros del Cron Autónomo
              </h3>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Próximo escaneo: En ~6 horas
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground font-semibold">Frecuencia de Ejecución:</label>
                <Select defaultValue="daily_08am">
                  <SelectTrigger className="h-9 text-xs bg-background/80">
                    <SelectValue placeholder="Frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_08am">🌅 Diario a las 08:00 AM</SelectItem>
                    <SelectItem value="every_12h">⏱️ Cada 12 Horas (Doble turno)</SelectItem>
                    <SelectItem value="every_6h">⚡ Cada 6 Horas (Alta intensidad)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-semibold">Formato Objetivo:</label>
                <Select defaultValue="short">
                  <SelectTrigger className="h-9 text-xs bg-background/80">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">📱 9:16 Shorts / Reels / TikTok</SelectItem>
                    <SelectItem value="long">🖥️ 16:9 Video Horizontal Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-semibold">Preferencia de Nicho:</label>
                <Select defaultValue="all">
                  <SelectTrigger className="h-9 text-xs bg-background/80">
                    <SelectValue placeholder="Nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌟 Mayor RPM & Winning Score</SelectItem>
                    <SelectItem value="dropshipping">🛍️ Dropshipping & TikTok Shop</SelectItem>
                    <SelectItem value="faceless">🕵️ Historias & Misterios Faceless</SelectItem>
                    <SelectItem value="finance">💰 Finanzas & Inversión</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-semibold">Videos por Ciclo:</label>
                <Input defaultValue="2 videos" readOnly className="h-9 text-xs bg-background/80" />
              </div>
            </div>

            {/* Notification Webhook */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" /> Notificación a Telegram / Discord:
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">Webhooks Soportados</span>
              </div>
              <Input
                defaultValue="https://discord.com/api/webhooks/mock-telegram-alert"
                className="h-8 text-xs font-mono bg-background/60"
              />
              <span className="text-[11px] text-muted-foreground block">
                Recibirás una alerta instantánea en tu teléfono cada vez que un nuevo video quede producido en tu PC.
              </span>
            </div>
          </Card>

          {/* Live Pipeline Diagram Card */}
          <Card className="border-border/80 bg-card/50 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Flujo Autónomo del Ciclo (Pipeline):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
                <span className="text-base block">🔍</span>
                <strong className="block text-foreground">1. Radar Scan</strong>
                <span className="text-muted-foreground text-[10px]">Escanea productos y canales outliers</span>
              </div>
              <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
                <span className="text-base block">🧠</span>
                <strong className="block text-foreground">2. Gancho AI</strong>
                <span className="text-muted-foreground text-[10px]">Selecciona el ángulo con más retención</span>
              </div>
              <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
                <span className="text-base block">🏎️</span>
                <strong className="block text-foreground">3. Inyección</strong>
                <span className="text-muted-foreground text-[10px]">Disparo HTTP directo a port :8000</span>
              </div>
              <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
                <span className="text-base block">📱</span>
                <strong className="block text-foreground">4. Alerta Móvil</strong>
                <span className="text-muted-foreground text-[10px]">Aviso a tu Telegram / Discord</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Execution Feedback & Stats */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 border-border/60 bg-card/70">
              <span className="text-[11px] text-muted-foreground block">Ciclos Completados</span>
              <strong className="text-xl font-bold text-foreground mt-0.5 block">
                {config?.stats?.total_cycles_run || 18}
              </strong>
              <span className="text-[10px] text-emerald-400 font-semibold">100% de éxito</span>
            </Card>

            <Card className="p-4 border-border/60 bg-card/70">
              <span className="text-[11px] text-muted-foreground block">Videos Producidos</span>
              <strong className="text-xl font-bold text-foreground mt-0.5 block">
                {config?.stats?.total_videos_produced || 36}
              </strong>
              <span className="text-[10px] text-indigo-400 font-semibold">Costo: $0.00</span>
            </Card>
          </div>

          {/* Last Run Report Card */}
          <Card className="border-border/80 bg-card/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Última Ejecución Autónoma:
              </h4>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                ÉXITO
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-background/50 border border-border/40 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Oportunidad Seleccionada:</span>
                <strong className="text-foreground text-xs">
                  {lastCycleResult?.opportunity?.title || 'Cafetera Espresso Portátil OutIn (Trend +380%)'}
                </strong>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Gancho & Ángulo:</span>
                <p className="text-muted-foreground text-[11px] italic">
                  "{lastCycleResult?.opportunity?.angle || '¡Deja de gastar $5 todos los días en Starbucks!'}"
                </p>
              </div>

              <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Encolado en YouTube Automation (:8000)
                </span>
                <span className="text-muted-foreground font-mono">
                  {lastCycleResult?.execution_time_ms ? `${lastCycleResult.execution_time_ms}ms` : '182ms'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
