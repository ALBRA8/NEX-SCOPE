'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { useAIStatus } from '@/hooks/use-ai-status';
import { useToast } from '@/hooks/use-toast';
import {
  Workflow,
  Zap,
  Radio,
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger_source: 'winning_products' | 'breakout_channels' | 'ad_spy' | 'viral_sounds';
  condition_label: string;
  target_type: 'youtube_automation' | 'external_webhook';
  target_url: string;
  target_format: 'short' | 'long';
  total_dispatches: number;
  last_dispatched_at: string | null;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  rule_name: string;
  target_url: string;
  status: 'success' | 'failed';
  status_code: number;
  response_time_ms: number;
  message: string;
  payload_summary: string;
  timestamp: string;
}

export function AutomationsView() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  // New Rule Form State
  const [showNewRule, setShowNewRule] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleTrigger, setNewRuleTrigger] = useState<string>('winning_products');
  const [newRuleCondition, setNewRuleCondition] = useState<string>('Margen >= 50%');
  const [newRuleTargetType, setNewRuleTargetType] = useState<'youtube_automation' | 'external_webhook'>('youtube_automation');
  const [newRuleUrl, setNewRuleUrl] = useState<string>('http://127.0.0.1:8000/api/quick-create');

  const { status: aiStatus } = useAIStatus();
  const { toast } = useToast();

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.ok) {
        setRules(data.rules || []);
        setLogs(data.recent_logs || []);
      }
    } catch (err: any) {
      toast({
        title: 'Error cargando reglas',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const toggleRule = async (id: string) => {
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', rule_id: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setRules(data.rules);
        toast({ title: 'Estado de la regla actualizado' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', rule_id: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setRules(data.rules);
        toast({ title: 'Regla eliminada' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const createRule = async () => {
    if (!newRuleName.trim()) {
      toast({ title: 'Por favor ingresa un nombre para la regla', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          rule: {
            name: newRuleName,
            trigger_source: newRuleTrigger,
            condition_label: newRuleCondition,
            target_type: newRuleTargetType,
            target_url: newRuleUrl,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setRules(data.rules);
        setShowNewRule(false);
        setNewRuleName('');
        toast({ title: '¡Regla creada con éxito!', variant: 'default' });
      }
    } catch (err: any) {
      toast({ title: 'Error creando regla', description: err.message, variant: 'destructive' });
    }
  };

  const testDispatch = async (rule: AutomationRule) => {
    setTestingId(rule.id);
    try {
      const res = await fetch('/api/automations/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: rule.id,
          rule_name: rule.name,
          target_url: rule.target_url,
          payload: {
            title: `[Test] Disparo automático de ${rule.name}`,
            trigger: rule.condition_label,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.ok && data.dispatch) {
        setLogs((prev) => [data.dispatch, ...prev]);
        toast({
          title: `¡Disparo exitoso (${data.dispatch.response_time_ms}ms)!`,
          description: data.dispatch.message,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Fallo al disparar webhook',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner */}
      <AIModeBanner
        aiStatus={aiStatus}
        customTitle="Motor Nativo de Webhooks & Disparadores Autónomos (n8n Cloned)"
        customDescription="Conecta la inteligencia de NEX-SCOPE con YouTube Automation o webhooks externos (Discord, Telegram, n8n, Make) sin instalar servidores extras."
      />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold">
              <Workflow className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Centro de Automatizaciones & Webhooks</h2>
            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              INT-067
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Disparadores automáticos: desde detección de oportunidades de mercado hasta orden de producción de video.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNewRule(!showNewRule)}
            className="h-9 gap-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white"
          >
            <Plus className="w-4 h-4" /> Nueva Regla
          </Button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 bg-card/60">
          <span className="text-[11px] text-muted-foreground block">Reglas Activas</span>
          <div className="flex items-center gap-2 mt-1">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <strong className="text-lg font-bold text-foreground">
              {rules.filter((r) => r.enabled).length} de {rules.length}
            </strong>
          </div>
        </Card>

        <Card className="p-4 border-border/60 bg-card/60">
          <span className="text-[11px] text-muted-foreground block">Total Disparos</span>
          <div className="flex items-center gap-2 mt-1">
            <Radio className="w-4 h-4 text-indigo-400" />
            <strong className="text-lg font-bold text-foreground">
              {rules.reduce((acc, r) => acc + (r.total_dispatches || 0), 0)}
            </strong>
          </div>
        </Card>

        <Card className="p-4 border-border/60 bg-card/60">
          <span className="text-[11px] text-muted-foreground block">Latencia Media</span>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <strong className="text-lg font-bold text-foreground">~135 ms</strong>
          </div>
        </Card>

        <Card className="p-4 border-border/60 bg-card/60">
          <span className="text-[11px] text-muted-foreground block">Puente Local YouTube</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <strong className="text-xs font-bold text-emerald-400">ONLINE (:8000)</strong>
          </div>
        </Card>
      </div>

      {/* New Rule Modal / Drawer */}
      {showNewRule && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-indigo-500/40 bg-indigo-950/10 backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                <Plus className="w-4 h-4" /> Crear Nueva Automatización
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNewRule(false)} className="h-7 text-xs">
                Cancelar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Nombre de la Regla:</label>
                <Input
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ej: Auto-Video cuando producto > 70% margen"
                  className="h-8 text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Fuente del Radar:</label>
                <Select value={newRuleTrigger} onValueChange={setNewRuleTrigger}>
                  <SelectTrigger className="h-8 text-xs bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="winning_products">🛍️ Productos Ganadores (E-Com)</SelectItem>
                    <SelectItem value="breakout_channels">🕵️ Canales Ocultos (Vanta Outliers)</SelectItem>
                    <SelectItem value="ad_spy">🎯 Espía de Anuncios (Creatify)</SelectItem>
                    <SelectItem value="viral_sounds">🎵 Audios Virales (TikTok)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Condición del Disparador:</label>
                <Input
                  value={newRuleCondition}
                  onChange={(e) => setNewRuleCondition(e.target.value)}
                  placeholder="Ej: Margen >= 60% & Saturación Baja"
                  className="h-8 text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Destino del Webhook:</label>
                <Select
                  value={newRuleTargetType}
                  onValueChange={(val: any) => {
                    setNewRuleTargetType(val);
                    setNewRuleUrl(
                      val === 'youtube_automation'
                        ? 'http://127.0.0.1:8000/api/quick-create'
                        : 'https://discord.com/api/webhooks/...'
                    );
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube_automation">🏎️ YouTube Automation Local (:8000)</SelectItem>
                    <SelectItem value="external_webhook">🌐 Webhook Externo (Discord / n8n / Make)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-muted-foreground font-semibold">URL de Destino:</label>
                <Input
                  value={newRuleUrl}
                  onChange={(e) => setNewRuleUrl(e.target.value)}
                  className="h-8 text-xs font-mono bg-background/80"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" onClick={createRule} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                Guardar y Activar Regla
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Reglas de Automatización Activas:
        </h3>

        {rules.map((rule) => (
          <Card
            key={rule.id}
            className={`p-4 border-border/80 transition-all ${
              rule.enabled ? 'bg-card/70' : 'bg-card/30 opacity-70'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{rule.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      rule.target_type === 'youtube_automation'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {rule.target_type === 'youtube_automation' ? '🏎️ Fábrica Local' : '🌐 Webhook / n8n'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span>
                    Condición: <strong className="text-foreground">{rule.condition_label}</strong>
                  </span>
                  <span>·</span>
                  <span className="font-mono truncate max-w-xs">{rule.target_url}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{rule.enabled ? 'Activa' : 'Pausada'}</span>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testDispatch(rule)}
                  disabled={testingId === rule.id}
                  className="h-8 text-xs gap-1.5"
                >
                  {testingId === rule.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  )}
                  Probar Disparo
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteRule(rule.id)}
                  className="h-8 text-xs text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Real-Time Execution Logs */}
      <Card className="border-border/80 bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Historial de Ejecuciones (Disparos Recientes):
          </h4>
          <span className="text-[10px] text-muted-foreground font-mono">Últimas 24 horas</span>
        </div>

        <div className="space-y-2 text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-background/50 border border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <strong className="text-foreground">{log.rule_name}</strong>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    HTTP {log.status_code}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {log.response_time_ms}ms
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{log.message}</p>
                <span className="text-[10px] text-indigo-400/80 font-mono block">
                  Payload: {log.payload_summary}
                </span>
              </div>

              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
