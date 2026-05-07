'use client';

import { useState } from 'react';
import { niches } from '@/lib/mock-data';
import { ContentGap } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis,
} from 'recharts';
import { Gap, Loader2, Lightbulb, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

// Mock content gaps
const mockGaps: ContentGap[] = [
  { topic: 'IA para principiantes en español', searchVolume: 45000, existingVideos: 120, opportunityScore: 92, suggestedTitle: 'IA desde Cero: Guía Completa en Español 2026' },
  { topic: 'Automatización con ChatGPT', searchVolume: 38000, existingVideos: 85, opportunityScore: 88, suggestedTitle: '10 Automatizaciones con ChatGPT que Ahorrarán Horas' },
  { topic: 'Notion para freelancers', searchVolume: 22000, existingVideos: 45, opportunityScore: 85, suggestedTitle: 'Sistema Notion Definitivo para Freelancers' },
  { topic: 'Finanzas para jóvenes', searchVolume: 65000, existingVideos: 200, opportunityScore: 80, suggestedTitle: 'Finanzas a los 20: Lo que Nadie te Enseña' },
  { topic: 'Yoga en casa sin equipamiento', searchVolume: 28000, existingVideos: 90, opportunityScore: 78, suggestedTitle: '30 Días de Yoga en Casa: Transforma tu Cuerpo' },
  { topic: 'Cocina vegana económica', searchVolume: 18000, existingVideos: 35, opportunityScore: 82, suggestedTitle: 'Cocina Vegana por $5 al Día: Meal Prep Semanal' },
  { topic: 'Streaming para principiantes', searchVolume: 32000, existingVideos: 110, opportunityScore: 75, suggestedTitle: 'Cómo Empezar a Hacer Streaming desde Cero' },
  { topic: 'Inversiones en ETFs', searchVolume: 42000, existingVideos: 150, opportunityScore: 72, suggestedTitle: 'ETFs para Principiantes: Guía Definitiva 2026' },
];

export function ContentGapView() {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const { setActiveView } = useAppStore();

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche || 'Inteligencia Artificial & ML' }),
      });
      const data = await res.json();
      setGaps(data.gaps || mockGaps);
    } catch {
      setGaps(mockGaps);
    }
    setLoading(false);
  };

  const scatterData = (gaps.length > 0 ? gaps : mockGaps).map(g => ({
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

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un nicho..." />
                </SelectTrigger>
                <SelectContent>
                  {niches.map(n => (
                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="O escribe un nicho personalizado..."
              className="flex-1"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gap className="w-4 h-4 mr-2" />}
              Analizar Brechas
            </Button>
          </div>
        </CardContent>
      </Card>

      {(gaps.length > 0 || true) && (
        <>
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
              {(gaps.length > 0 ? gaps : mockGaps).map((gap, i) => (
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
