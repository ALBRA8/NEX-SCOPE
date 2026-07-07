'use client';

import { useState, useEffect } from 'react';
import { VideoIdea } from '@/lib/types';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Loader2, Download, Sparkles, Save, Trash2, Clock, History, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const difficultyColors = {
  fácil: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  medio: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  difícil: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

type PlanMode = 'idle' | 'ai' | 'error';

export function ContentPlanView() {
  const [niche, setNiche] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<VideoIdea[]>([]);
  const [mode, setMode] = useState<PlanMode>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const { savedPlans, loadSavedPlans, savePlan, deletePlan } = useAppStore();
  const { toast } = useToast();
  const { status: aiStatus, check: recheckAI } = useAIStatus();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { loadSavedPlans(); }, [loadSavedPlans]);

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');
    setPlan([]);
    setMode('idle');
    try {
      const res = await fetch('/api/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche || 'Inteligencia Artificial & ML', audience: audience || 'Jóvenes de 18-35 años' }),
      });
      const data = await res.json();
      if (!res.ok) { setMode('error'); setErrorMsg(data?.error || 'Error al generar plan.'); return; }
      if (Array.isArray(data.plan) && data.plan.length > 0) { setPlan(data.plan); setMode('ai'); }
      else { setMode('error'); setErrorMsg('La IA no devolvió videos. Intenta de nuevo.'); }
    } catch (err: any) { setMode('error'); setErrorMsg(err?.message || 'Error de red.'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (plan.length === 0) { toast({ title: 'Nada que guardar', description: 'Genera un plan primero.', variant: 'destructive' }); return; }
    const result = await savePlan(niche || 'Inteligencia Artificial & ML', audience || 'Jóvenes de 18-35 años', plan);
    if (result.success) { toast({ title: 'Plan guardado', description: `Plan para "${niche || 'IA'}" guardado.` }); }
    else { toast({ title: 'Error al guardar', description: result.error || 'No se pudo guardar.', variant: 'destructive' }); }
  };

  const handleLoadPlan = (planData: string) => {
    try {
      const parsed = JSON.parse(planData) as VideoIdea[];
      setPlan(parsed);
      setSelectedWeek(null);
      setShowHistory(false);
      setMode('ai');
      toast({ title: 'Plan cargado', description: `${parsed.length} videos cargados.` });
    } catch { toast({ title: 'Error', description: 'Datos corruptos.', variant: 'destructive' }); }
  };

  const handleDeletePlan = async (id: string) => {
    await deletePlan(id);
    toast({ title: 'Plan eliminado', description: 'El plan ha sido borrado.' });
  };

  const handleExportCSV = () => {
    if (plan.length === 0) { toast({ title: 'Nada que exportar', variant: 'destructive' }); return; }
    const headers = ['Semana', 'Título', 'Descripción', 'Formato', 'Dificultad', 'Vistas estimadas', 'Keywords'];
    const rows = plan.map((v) => [v.week, `"${v.title.replace(/"/g, '""')}"`, `"${v.description.replace(/"/g, '""')}"`, v.format, v.difficulty, v.estimatedViews, `"${v.keywords.join(', ')}"`]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexscope-plan-${(niche || 'plan').replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado', description: `${plan.length} videos exportados.` });
  };

  const filteredPlan = selectedWeek ? plan.filter(v => v.week === selectedWeek) : plan;
  const weeks = [...new Set(plan.map(v => v.week))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Plan de Contenido</h2>
        <p className="text-muted-foreground text-sm">Genera un plan de 30 videos con IA, guárdalo y expórtalo a CSV</p>
      </div>

      <AIModeBanner available={aiStatus.available} loading={aiStatus.loading} error={aiStatus.error} onRetry={recheckAI} />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Nicho (ej: Finanzas Personales)" value={niche} onChange={(e) => setNiche(e.target.value)} className="flex-1" />
            <Input placeholder="Audiencia (ej: Jóvenes 18-35)" value={audience} onChange={(e) => setAudience(e.target.value)} className="flex-1" />
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generar Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {mode === 'error' && !loading && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">No se pudo generar con IA</p>
              <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
              <Button variant="outline" size="sm" className="text-xs h-7 mt-2" onClick={handleGenerate}>Reintentar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'ai' && plan.length > 0 && (
        <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600">Generado por IA · {plan.length} videos</Badge>
      )}

      {mode === 'idle' && !loading && plan.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Escribe un nicho y pulsa "Generar Plan"</p>
            <p className="text-xs mt-1">La IA creará 30 ideas de video organizadas en 10 semanas.</p>
          </CardContent>
        </Card>
      )}

      {plan.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant={selectedWeek === null ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setSelectedWeek(null)}>Todas</Button>
          {weeks.map(w => (
            <Button key={w} variant={selectedWeek === w ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setSelectedWeek(w)}>Semana {w}</Button>
          ))}
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-3 h-3 mr-1" />{showHistory ? 'Ocultar' : `Guardados (${savedPlans.length})`}
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleSave}><Save className="w-3 h-3 mr-1" /> Guardar</Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleExportCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
        </div>
      )}

      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" />Planes guardados ({savedPlans.length})</CardTitle></CardHeader>
              <CardContent>
                {savedPlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aún no has guardado ningún plan.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {savedPlans.map((p) => {
                      let count = 0;
                      try { count = JSON.parse(p.planData).length; } catch {}
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.niche}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3 h--3" />{new Date(p.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {count} videos{p.audience ? ` · ${p.audience}` : ''}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setNiche(p.niche); setAudience(p.audience); handleLoadPlan(p.planData); }}>Cargar</Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePlan(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {plan.length > 0 && (
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence>
            {filteredPlan.map((video, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-md transition-shadow border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">Sem {video.week}</Badge>
                          <h3 className="font-semibold text-sm truncate">{video.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{video.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {video.keywords.map(kw => (<Badge key={kw} variant="secondary" className="text-[10px] px-1.5 py-0">{kw}</Badge>))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className={cn('text-[10px]', difficultyColors[video.difficulty as keyof typeof difficultyColors] || '')}>{video.difficulty}</Badge>
                        <span className="text-[10px] text-muted-foreground">{video.format}</span>
                        <span className="text-xs font-semibold text-emerald-500">~{(video.estimatedViews / 1000).toFixed(0)}K vistas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
