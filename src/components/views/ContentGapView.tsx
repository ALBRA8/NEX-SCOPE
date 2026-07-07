'use client';

import { useState } from 'react';
// No more mock imports — all data comes from Z.ai API
import { ContentGap } from '@/lib/types';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis,
} from 'recharts';
import { Puzzle, Loader2, Lightbulb, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

type Mode = 'idle' | 'ai' | 'error';

export function ContentGapView() {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { setActiveView } = useAppStore();
  const { status: aiStatus, check: recheckAI } = useAIStatus();

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg('');
    setGaps([]);
    setMode('idle');

    try {
      const res = await fetch('/api/content-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche || 'Inteligencia Artificial & ML' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMode('error');
        setErrorMsg(data?.error || 'Error al analizar brechas.');
        return;
      }

      if (Array.isArray(data.gaps) && data.gaps.length > 0) {
        setGaps(data.gaps);
        setMode('ai');
      } else {
        setMode('error');
        setErrorMsg('La IA no devolvió brechas. Intenta con otro nicho.');
      }
    } catch (err: any) {
      setMode('error');
      setErrorMsg(err?.message || 'Error de red.');
    } finally {
      setLoading(false);
    }
  };



  const displayGaps = gaps;
  const scatterData = displayGaps.map(g => ({
    x: g.existingVideos,
    y: g.searchVolume,
    z: g.opportunityScore,
    name: g.topic,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Brechas de Contenido</h2>
        <p className="text-muted-foreground text-sm">Encuentra oportunidades de contenido sin explotar con IA</p>
      </div>

      <AIModeBanner
        available={aiStatus.available}
        loading={aiStatus.loading}
        error={aiStatus.error}
        onRetry={recheckAI}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Escribe un nicho (ej: Finanzas Personales, Gaming...)"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Puzzle className="w-4 h-4 mr-2" />}
              Analizar Brechas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {mode === 'error' && !loading && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">No se pudo analizar con IA</p>
              <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleAnalyze}>
                  Reintentar IA
                </Button>

              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state — only show BEFORE the user has tried anything */}
      {mode === 'idle' && !loading && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecciona un nicho y pulsa "Analizar Brechas"</p>
            <p className="text-xs mt-1">La IA generará 8 oportunidades de contenido basadas en el nicho.</p>
          </CardContent>
        </Card>
      )}

      {/* Results — only when we actually have data */}
      {mode === 'ai' && displayGaps.length > 0 && (
        <>
          {/* Mode badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600">
              Generado por IA
            </Badge>
            <span className="text-xs text-muted-foreground">{displayGaps.length} brechas encontradas</span>
          </div>

          {/* Opportunity Matrix */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Matriz de Oportunidad</CardTitle>
                <p className="text-xs text-muted-foreground">Volumen de búsqueda vs Competencia (tamaño = puntuación de oportunidad)</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="x" name="Videos Existentes" tick={{ fontSize: 10 }} label={{ value: 'Videos Existentes', position: 'bottom', fontSize: 10, offset: -5 }} />
                    <YAxis dataKey="y" name="Volumen" tick={{ fontSize: 10 }} label={{ value: 'Volumen', angle: -90, position: 'left', fontSize: 10 }} />
                    <ZAxis dataKey="z" range={[100, 800]} name="Oportunidad" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                      formatter={(_: number, name: string) => {
                        if (name === 'Videos Existentes') return [_, 'Videos'];
                        if (name === 'Volumen') return [_, 'Búsqueda'];
                        return [_, 'Oportunidad'];
                      }}
                      labelFormatter={(_, payload) => {
                        if (payload && payload[0]) {
                          const d = payload[0].payload;
                          return d.name;
                        }
                        return '';
                      }}
                    />
                    <Scatter data={scatterData} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Gap Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {displayGaps.map((gap, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <h3 className="font-semibold text-sm">{gap.topic}</h3>
                          </div>
                          <p className="text-xs text-primary font-medium">{gap.suggestedTitle}</p>
                        </div>
                        <Badge className={cn(
                          'text-xs shrink-0',
                          gap.opportunityScore >= 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          gap.opportunityScore >= 70 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        )} variant="outline">
                          {gap.opportunityScore}/100
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 rounded bg-muted/30">
                          <p className="text-xs font-bold">{(gap.searchVolume / 1000).toFixed(0)}K</p>
                          <p className="text-[10px] text-muted-foreground">Búsqueda</p>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/30">
                          <p className="text-xs font-bold">{gap.existingVideos}</p>
                          <p className="text-[10px] text-muted-foreground">Videos</p>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/30">
                          <p className="text-xs font-bold text-emerald-500">{gap.opportunityScore}%</p>
                          <p className="text-[10px] text-muted-foreground">Oportunidad</p>
                        </div>
                      </div>
                      <Button
                        variant="outline" size="sm"
                        className="w-full mt-3 text-xs h-8"
                        onClick={() => setActiveView('content-plan')}
                      >
                        Generar Plan <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
