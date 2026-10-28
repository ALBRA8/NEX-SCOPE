'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportToAutomationButton } from '@/components/shared/ExportToAutomationButton';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { useAIStatus } from '@/hooks/use-ai-status';
import { useToast } from '@/hooks/use-toast';
import {
  Flame,
  Zap,
  TrendingUp,
  Clock,
  Users,
  Eye,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Tv,
  ArrowUpRight,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface ViralVideoItem {
  title: string;
  views: string;
  outlier_factor: string;
  published_days_ago: number;
  video_url: string;
}

export interface BreakoutChannel {
  id: string;
  channel_name: string;
  handle: string;
  avatar: string;
  channel_age_days: number;
  subscribers: string;
  video_count: number;
  niche: string;
  breakout_score: number;
  outlier_multiplier: string;
  growth_velocity: string;
  why_it_works: string;
  recommended_action: string;
  top_viral_videos: ViralVideoItem[];
}

export function BreakoutChannelsView() {
  const [channels, setChannels] = useState<BreakoutChannel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNiche, setSelectedNiche] = useState<string>('General');
  const [selectedMaxAge, setSelectedMaxAge] = useState<string>('90');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { status: aiStatus } = useAIStatus();
  const { toast } = useToast();

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/breakout-channels?niche=${encodeURIComponent(selectedNiche)}&max_age=${selectedMaxAge}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.channels)) {
        setChannels(data.channels);
      }
    } catch (err: any) {
      toast({
        title: 'Error al escanear canales anómalos',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChannels();
  }, [selectedNiche, selectedMaxAge]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: '¡Idea copiada!',
      description: 'Título y ángulo listos en el portapapeles.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <AIModeBanner
        available={aiStatus.available}
        loading={aiStatus.loading}
      />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 font-bold">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Radar de Canales Anómalos & Breakouts</h2>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
              INT-063
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Descubre nichos y ángulos virales no saturados antes de que la competencia los detecte.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">🌐 Todos los Nichos</SelectItem>
                <SelectItem value="Misterio & Historias Faceless">🕵️ Misterio & Faceless</SelectItem>
                <SelectItem value="Finanzas & Inversión">💰 Finanzas & Inversión</SelectItem>
                <SelectItem value="Productividad & Hábitos">⚡ Productividad & Salud</SelectItem>
                <SelectItem value="Tecnología & IA">🤖 Tecnología & IA</SelectItem>
                <SelectItem value="Curiosidades & Ciencia">🧬 Curiosidades & Ciencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={selectedMaxAge} onValueChange={setSelectedMaxAge}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Antigüedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">👶 Menos de 30 días</SelectItem>
                <SelectItem value="60">🐣 Menos de 60 días</SelectItem>
                <SelectItem value="90">🚀 Menos de 90 días</SelectItem>
                <SelectItem value="180">🗓️ Menos de 180 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchChannels}
            disabled={loading}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            Actualizar Radar
          </Button>
        </div>
      </div>

      {/* Grid of Breakout Channels */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs text-muted-foreground">Escaneando base de datos de YouTube en busca de outliers recientes...</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No se encontraron canales con los filtros seleccionados. Intenta ampliar la antigüedad o cambiar de nicho.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {channels.map((ch, idx) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
            >
              <Card className="h-full flex flex-col justify-between border-border/80 hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md bg-card/70 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={ch.avatar}
                          alt={ch.channel_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/30"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                          NEW
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          {ch.channel_name}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                          {ch.handle} · <span className="text-amber-400 font-sans">{ch.niche}</span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Zap className="w-3.5 h-3.5 fill-amber-500" />
                        <span>Breakout {ch.breakout_score}/100</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {ch.outlier_multiplier} sobre la media
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  {/* Quick stats pills */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-background/50 border border-border/40 text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Antigüedad</span>
                      <strong className="font-semibold text-foreground text-xs">{ch.channel_age_days} días</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Suscriptores</span>
                      <strong className="font-semibold text-foreground text-xs">{ch.subscribers}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Velocidad</span>
                      <strong className="font-semibold text-emerald-400 text-xs">{ch.growth_velocity}</strong>
                    </div>
                  </div>

                  {/* Why it works */}
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> ¿Por qué está explotando?
                    </span>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {ch.why_it_works}
                    </p>
                  </div>

                  {/* Replicate Strategy */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-1">
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" /> Oportunidad de Réplica
                    </span>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {ch.recommended_action}
                    </p>
                  </div>

                  {/* Top Viral Videos */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      Videos Anómalos Outliers:
                    </span>
                    <div className="space-y-1.5">
                      {ch.top_viral_videos.map((vid, vIdx) => (
                        <div
                          key={vIdx}
                          className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/30 hover:border-amber-500/30 transition-all"
                        >
                          <div className="truncate pr-2">
                            <p className="font-medium text-xs truncate text-foreground">{vid.title}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {vid.views} views · Hace {vid.published_days_ago} días
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0">
                            {vid.outlier_factor} outlier
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        copyText(
                          `${ch.top_viral_videos[0]?.title || ch.channel_name}\nÁngulo: ${ch.why_it_works}`,
                          ch.id
                        )
                      }
                    >
                      {copiedId === ch.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === ch.id ? 'Copiado' : 'Copiar Ángulo'}
                    </Button>

                    <ExportToAutomationButton
                      buttonVariant="default"
                      buttonSize="sm"
                      className="h-8 text-xs bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold"
                      payload={{
                        title: ch.top_viral_videos[0]?.title || ch.channel_name,
                        idea_summary: `Canal oculto detectado en nicho ${ch.niche}. Ángulo: ${ch.why_it_works}`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
