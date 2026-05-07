'use client';

import { useState } from 'react';
import { niches } from '@/lib/mock-data';
import { VideoIdea } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CalendarDays, Loader2, Download, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const mockPlan: VideoIdea[] = [
  { title: 'Introducción a [Nicho]: Todo lo que Necesitas Saber', description: 'Video introductorio que cubre los fundamentos del nicho para principiantes', keywords: ['introducción', 'guía', 'principiantes'], estimatedViews: 15000, difficulty: 'fácil', format: 'Tutorial', week: 1 },
  { title: 'Los 10 Errores más Comunes en [Nicho]', description: 'Análisis de errores frecuentes y cómo evitarlos', keywords: ['errores', 'consejos', 'tips'], estimatedViews: 25000, difficulty: 'fácil', format: 'Lista', week: 1 },
  { title: 'Cómo Empezar en [Nicho] desde Cero', description: 'Guía paso a paso para principiantes absolutos', keywords: ['empezar', 'cero', 'guía'], estimatedViews: 18000, difficulty: 'fácil', format: 'Tutorial', week: 1 },
  { title: 'Review: Las Mejores Herramientas para [Nicho]', description: 'Comparativa de herramientas y recursos esenciales', keywords: ['review', 'herramientas', 'comparativa'], estimatedViews: 22000, difficulty: 'medio', format: 'Review', week: 2 },
  { title: 'Mitos y Verdades sobre [Nicho]', description: 'Desmentir mitos comunes con datos reales', keywords: ['mitos', 'verdades', 'datos'], estimatedViews: 30000, difficulty: 'medio', format: 'Análisis', week: 2 },
  { title: 'Mi Experiencia Personal en [Nicho]', description: 'Historia personal y lecciones aprendidas', keywords: ['experiencia', 'personal', 'historia'], estimatedViews: 20000, difficulty: 'fácil', format: 'Vlog', week: 2 },
  { title: 'Tutorial Avanzado: Técnicas Pro de [Nicho]', description: 'Técnicas avanzadas para quienes ya tienen experiencia', keywords: ['avanzado', 'técnicas', 'pro'], estimatedViews: 12000, difficulty: 'difícil', format: 'Tutorial', week: 3 },
  { title: '[Nicho] en 2026: Tendencias y Predicciones', description: 'Análisis de las tendencias actuales y futuro del nicho', keywords: ['tendencias', '2026', 'predicciones'], estimatedViews: 35000, difficulty: 'medio', format: 'Análisis', week: 3 },
  { title: 'Preguntas y Respuestas: Lo que Nadie te Cuenta', description: 'FAQ respondiendo las dudas más buscadas', keywords: ['preguntas', 'FAQ', 'respuestas'], estimatedViews: 16000, difficulty: 'fácil', format: 'Q&A', week: 3 },
  { title: 'Reto: 30 Días en [Nicho]', description: 'Documental del reto personal durante 30 días', keywords: ['reto', '30 días', 'challenge'], estimatedViews: 45000, difficulty: 'difícil', format: 'Serie', week: 4 },
  { title: 'Comparativa: Método A vs Método B', description: 'Comparación detallada de dos enfoques populares', keywords: ['comparativa', 'vs', 'métodos'], estimatedViews: 28000, difficulty: 'medio', format: 'Análisis', week: 4 },
  { title: 'Top 5 Recursos Gratuitos para [Nicho]', description: 'Recopilación de los mejores recursos sin costo', keywords: ['gratis', 'recursos', 'top'], estimatedViews: 32000, difficulty: 'fácil', format: 'Lista', week: 4 },
  { title: 'Entrevista con Experto de [Nicho]', description: 'Conversación con un referente del sector', keywords: ['entrevista', 'experto', 'consejos'], estimatedViews: 19000, difficulty: 'medio', format: 'Entrevista', week: 5 },
  { title: 'Guía de Compras: Lo que Debes Adquirir', description: 'Recomendaciones de productos y servicios', keywords: ['compras', 'guía', 'productos'], estimatedViews: 24000, difficulty: 'fácil', format: 'Review', week: 5 },
  { title: 'Transformación: Antes y Después en [Nicho]', description: 'Mostrar progreso y resultados tangibles', keywords: ['transformación', 'antes', 'después'], estimatedViews: 40000, difficulty: 'medio', format: 'Vlog', week: 5 },
  { title: 'Análisis de Casos de Éxito', description: 'Estudiar casos reales de éxito en el nicho', keywords: ['casos', 'éxito', 'análisis'], estimatedViews: 21000, difficulty: 'medio', format: 'Análisis', week: 6 },
  { title: 'Cómo Ganar Dinero con [Nicho]', description: 'Estrategias de monetización prácticas', keywords: ['dinero', 'monetización', 'ingresos'], estimatedViews: 50000, difficulty: 'medio', format: 'Tutorial', week: 6 },
  { title: 'Herramientas Secretas que los Pro Usan', description: 'Recursos menos conocidos pero muy efectivos', keywords: ['secreto', 'herramientas', 'pro'], estimatedViews: 27000, difficulty: 'difícil', format: 'Lista', week: 6 },
  { title: 'Paso a Paso: Tu Primera Semana', description: 'Guía detallada para la primera semana', keywords: ['paso a paso', 'primera semana', 'inicio'], estimatedViews: 17000, difficulty: 'fácil', format: 'Tutorial', week: 7 },
  { title: 'Datos y Estadísticas que Debes Conocer', description: 'Presentación visual de datos relevantes', keywords: ['datos', 'estadísticas', 'infografía'], estimatedViews: 23000, difficulty: 'medio', format: 'Análisis', week: 7 },
  { title: 'Lo que Nadie te Dice sobre [Nicho]', description: 'Verdades incómodas y consejos honestos', keywords: ['secreto', 'verdad', 'honesto'], estimatedViews: 38000, difficulty: 'fácil', format: 'Opinión', week: 7 },
  { title: 'Actualización Semanal: Noticias del Sector', description: 'Resumen de las noticias más relevantes', keywords: ['noticias', 'actualización', 'semanal'], estimatedViews: 14000, difficulty: 'fácil', format: 'Noticias', week: 8 },
  { title: 'Cómo Superar los Obstáculos en [Nicho]', description: 'Soluciones a los problemas más comunes', keywords: ['obstáculos', 'problemas', 'soluciones'], estimatedViews: 19000, difficulty: 'medio', format: 'Tutorial', week: 8 },
  { title: 'Plan de Acción de 90 Días', description: 'Hoja de ruta completa para 3 meses', keywords: ['plan', '90 días', 'acción'], estimatedViews: 42000, difficulty: 'difícil', format: 'Tutorial', week: 8 },
  { title: 'Recursos Premium que Valen la Pena', description: 'Análisis de recursos de pago', keywords: ['premium', 'pago', 'review'], estimatedViews: 15000, difficulty: 'medio', format: 'Review', week: 9 },
  { title: 'Tutorial en Vivo: Sesión Práctica', description: 'Demostración en tiempo real', keywords: ['vivo', 'práctica', 'demo'], estimatedViews: 25000, difficulty: 'difícil', format: 'Live', week: 9 },
  { title: 'Comunidad: Lee tus Comentarios', description: 'Interacción con la audiencia', keywords: ['comunidad', 'comentarios', 'interacción'], estimatedViews: 18000, difficulty: 'fácil', format: 'Q&A', week: 9 },
  { title: 'Ranking: Top 10 del Mes', description: 'Recopilación mensual de lo mejor', keywords: ['ranking', 'top', 'mejor'], estimatedViews: 29000, difficulty: 'fácil', format: 'Lista', week: 10 },
  { title: 'Especial: Recapitulación y Siguiente Nivel', description: 'Resumen del plan y próximos pasos', keywords: ['recapitulación', 'siguiente nivel', 'futuro'], estimatedViews: 22000, difficulty: 'medio', format: 'Análisis', week: 10 },
  { title: 'Bonus: Plantillas y Descargas Gratuitas', description: 'Material descargable para la audiencia', keywords: ['plantillas', 'descargas', 'gratis'], estimatedViews: 33000, difficulty: 'fácil', format: 'Tutorial', week: 10 },
];

const difficultyColors = {
  fácil: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  medio: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  difícil: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export function ContentPlanView() {
  const [niche, setNiche] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<VideoIdea[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche || 'Inteligencia Artificial & ML', audience: audience || 'Jóvenes de 18-35 años' }),
      });
      const data = await res.json();
      setPlan(data.plan || mockPlan);
    } catch {
      setPlan(mockPlan);
    }
    setLoading(false);
  };

  const displayPlan = plan.length > 0 ? plan : mockPlan;
  const filteredPlan = selectedWeek ? displayPlan.filter(v => v.week === selectedWeek) : displayPlan;
  const weeks = [...new Set(displayPlan.map(v => v.week))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Plan de Contenido</h2>
        <p className="text-muted-foreground text-sm">Genera un plan de 30 videos con IA</p>
      </div>

      {/* Generator */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecciona un nicho..." />
              </SelectTrigger>
              <SelectContent>
                {niches.map(n => (
                  <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Audiencia objetivo (ej: Jóvenes 18-35)"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generar Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Week Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedWeek === null ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-7"
          onClick={() => setSelectedWeek(null)}
        >
          Todas
        </Button>
        {weeks.map(w => (
          <Button
            key={w}
            variant={selectedWeek === w ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSelectedWeek(w)}
          >
            Semana {w}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 ml-auto"
          onClick={() => {/* simulated export */}}
        >
          <Download className="w-3 h-3 mr-1" /> Exportar
        </Button>
      </div>

      {/* Video Ideas */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
        <AnimatePresence>
          {filteredPlan.map((video, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
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
                        {video.keywords.map(kw => (
                          <Badge key={kw} variant="secondary" className="text-[10px] px-1.5 py-0">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className={cn('text-[10px]', difficultyColors[video.difficulty])}>
                        {video.difficulty}
                      </Badge>
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
    </div>
  );
}
