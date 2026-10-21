'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSearch,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const POWER_WORDS = [
  'secreto', 'secretos', 'revelado', 'nuevo', 'fácil', 'rápido', 'paso a paso',
  'definitivo', 'definitiva', 'error', 'errores', 'nunca', 'evita', 'gratis',
  'urgente', 'brutal', 'increíble', 'verdad', 'mentira', 'millonario', 'dinero',
  'éxito', 'mejor', 'peor', 'garantizado', 'sin experiencia', '2026', '24 horas', '30 días'
];

export function SEOAuditView() {
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const [auditResult, setAuditResult] = useState<any | null>(null);

  const runAudit = () => {
    if (!title.trim() && !description.trim() && !tags.trim()) {
      toast({ title: 'Rellena al menos el título para comenzar la auditoría', variant: 'destructive' });
      return;
    }

    const checks: any[] = [];
    let score = 0;

    // 1. TÍTULO
    const tLen = title.trim().length;
    if (tLen >= 40 && tLen <= 60) {
      checks.push({
        status: 'pass',
        label: 'Longitud del Título Óptima',
        detail: `Tiene ${tLen} caracteres. Perfecto para no cortarse en pantallas de smartphone.`
      });
      score += 25;
    } else if (tLen > 0 && tLen < 40) {
      checks.push({
        status: 'warn',
        label: 'Título Corto',
        detail: `Tiene ${tLen} caracteres. Podrías incluir un gancho o especificidad adicional.`
      });
      score += 15;
    } else if (tLen > 60) {
      checks.push({
        status: 'warn',
        label: 'Título Demasiado Largo',
        detail: `Tiene ${tLen} caracteres. YouTube recortará el texto con puntos suspensivos en móviles.`
      });
      score += 12;
    } else {
      checks.push({
        status: 'fail',
        label: 'Falta el Título',
        detail: 'El título es el elemento más determinante para el CTR y algoritmo de YouTube.'
      });
    }

    // 2. PALABRAS DE IMPACTO (POWER WORDS)
    const hasPower = POWER_WORDS.some(w => title.toLowerCase().includes(w));
    if (hasPower) {
      checks.push({
        status: 'pass',
        label: 'Palabras de Alto Impacto Detectadas',
        detail: 'Tu título incluye fórmulas de curiosidad o beneficio psicológico comprobado.'
      });
      score += 20;
    } else {
      checks.push({
        status: 'warn',
        label: 'Sin Palabras de Poder Notorias',
        detail: 'Añadir términos como "Paso a paso", "Definitivo", "Secreto" o números eleva el CTR.'
      });
      score += 5;
    }

    // 3. DESCRIPCIÓN
    const words = description.trim().split(/\s+/).filter(Boolean).length;
    if (words >= 120) {
      checks.push({
        status: 'pass',
        label: 'Descripción Completa y Rica en Contexto',
        detail: `Tiene ${words} palabras. Proporciona suficiente contexto temático a los algoritmos de búsqueda.`
      });
      score += 25;
    } else if (words >= 35) {
      checks.push({
        status: 'warn',
        label: 'Descripción Básica',
        detail: `Tiene ${words} palabras. Recomendado superar 100 palabras para posicionar en búsquedas.`
      });
      score += 15;
    } else {
      checks.push({
        status: 'fail',
        label: 'Descripción Escasa o Vacía',
        detail: 'Una descripción de menos de 30 palabras desaprovecha el SEO orgánico.'
      });
    }

    // 4. CAPÍTULOS / TIMESTAMPS
    const hasTimestamps = /0\d:\d\d|\d:\d\d/.test(description);
    if (hasTimestamps) {
      checks.push({
        status: 'pass',
        label: 'Marcas de Tiempo (Capítulos) Incluidas',
        detail: 'Activa los capítulos automáticos en el reproductor y en Google Search.'
      });
      score += 15;
    } else {
      checks.push({
        status: 'warn',
        label: 'Sin Marcas de Tiempo en la Descripción',
        detail: 'Añadir capítulos (ej: 00:00 Intro, 02:15 Paso 1) retiene al usuario y suma puntos SEO.'
      });
      score += 5;
    }

    // 5. ETIQUETAS (TAGS)
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagList.length >= 8 && tagList.length <= 25) {
      checks.push({
        status: 'pass',
        label: 'Distribución de Etiquetas Equilibrada',
        detail: `Has configurado ${tagList.length} etiquetas. Ayuda a YouTube a clasificar el nicho sin saturar.`
      });
      score += 15;
    } else if (tagList.length > 0 && tagList.length < 8) {
      checks.push({
        status: 'warn',
        label: 'Pocas Etiquetas',
        detail: `Tienes ${tagList.length} etiquetas. Se recomiendan entre 10 y 20 palabras clave.`
      });
      score += 8;
    } else {
      checks.push({
        status: 'fail',
        label: 'Sin Etiquetas',
        detail: 'Añade palabras clave para orientar las sugerencias iniciales del algoritmo.'
      });
    }

    score = Math.min(score, 100);

    setAuditResult({
      score,
      checks
    });

    toast({
      title: `Auditoría finalizada: ${score} / 100`,
      description: 'Revisa las recomendaciones para optimizar tu subida.'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <FileSearch className="w-7 h-7 text-primary" />
          Auditoría SEO de Publicación
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Verifica tu título, descripción y etiquetas antes de pulsar &quot;Publicar&quot; en YouTube Studio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Entrada (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Borrador del Vídeo</CardTitle>
              <CardDescription>Pega el contenido tal como lo subirás a YouTube Studio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Título</span>
                <Input
                  placeholder="Título de tu vídeo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Descripción Completa</span>
                <Textarea
                  rows={8}
                  placeholder="Pega la descripción con enlaces y marcas de tiempo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Etiquetas (separadas por comas)</span>
                <Input
                  placeholder="etiqueta 1, etiqueta 2, etiqueta 3..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <Button onClick={runAudit} className="w-full gap-2">
                <Search className="w-4 h-4" /> Ejecutar Auditoría SEO
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados del Diagnóstico (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-border/60 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Diagnóstico y Puntuación</CardTitle>
              <CardDescription>Resultados del análisis según los algoritmos de YouTube.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
              {auditResult ? (
                <div className="space-y-6">
                  {/* Gauge de Score */}
                  <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/40">
                    <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 border-primary font-black text-2xl text-primary shrink-0">
                      {auditResult.score}
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground -mt-1">Puntos</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base">
                        {auditResult.score >= 80 ? '🔥 ¡Excelente Optimización!' : auditResult.score >= 60 ? '⚡ Buen trabajo con mejoras' : '⚠️ Necesita Optimización'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {auditResult.score >= 80
                          ? 'Tu vídeo cumple los estándares clave de visibilidad y retención.'
                          : 'Aplica las mejoras amarillas o rojas para maximizar el alcance orgánico.'}
                      </p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3">
                    {auditResult.checks.map((c: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card/60">
                        {c.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                        {c.status === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
                        {c.status === 'fail' && <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
                        <div>
                          <h5 className="font-semibold text-xs text-foreground">{c.label}</h5>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <FileSearch className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium">Introduce tus datos y pulsa en &quot;Ejecutar Auditoría SEO&quot;</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                    El sistema verificará automáticamente factores de CTR, SEO y visibilidad móvil.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
