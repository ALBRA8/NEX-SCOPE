'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Copy,
  Check,
  Flame,
  FileText,
  Tags,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const POWER_WORDS = [
  'secreto', 'secretos', 'revelado', 'nuevo', 'fácil', 'rápido', 'paso a paso',
  'definitivo', 'definitiva', 'error', 'errores', 'nunca', 'evita', 'gratis',
  'urgente', 'brutal', 'increíble', 'verdad', 'mentira', 'millonario', 'dinero',
  'éxito', 'mejor', 'peor', 'garantizado', 'sin experiencia', '2026', '24 horas', '30 días'
];

export function VideoStudioView() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- Subpestaña 1: Títulos & CTR ---
  const [titleTopic, setTitleTopic] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [generatedTitles, setGeneratedTitles] = useState<any[]>([]);

  // --- Subpestaña 2: Guiones ---
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptAudience, setScriptAudience] = useState('Principiantes');
  const [scriptResult, setScriptResult] = useState<any | null>(null);

  // --- Subpestaña 3: Descripciones ---
  const [descTitle, setDescTitle] = useState('');
  const [descResult, setDescResult] = useState<string>('');

  // --- Subpestaña 4: Tags para YouTube Studio ---
  const [tagTopic, setTagTopic] = useState('');
  const [tagsList, setTagsList] = useState<{ text: string; selected: boolean; score: number }[]>([]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: '¡Copiado al portapapeles!',
      description: 'Listo para pegar en YouTube Studio.',
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  // --- LÓGICA DE TÍTULOS ---
  const analyzeTitle = (text: string) => {
    const len = text.length;
    const lower = text.toLowerCase();
    const detectedWords = POWER_WORDS.filter(w => lower.includes(w));

    let score = 30;
    if (len >= 40 && len <= 60) score += 30;
    else if (len > 25 && len <= 70) score += 20;
    else if (len > 0) score += 10;

    score += Math.min(detectedWords.length * 15, 30);
    if (/\d+/.test(text)) score += 10;
    score = Math.min(score, 100);

    return {
      len,
      score: len > 0 ? score : 0,
      powerWordsCount: detectedWords.length,
      detectedWords,
      isMobileIdeal: len <= 60 && len >= 35,
    };
  };

  const titleAnalysis = analyzeTitle(customTitle);

  const handleGenerateTitles = () => {
    if (!titleTopic.trim()) {
      toast({ title: 'Introduce un tema', variant: 'destructive' });
      return;
    }
    const t = titleTopic.trim();
    const templates = [
      { cat: 'Curiosidad', title: `El Secreto de ${t} que los Creadores Ocultan` },
      { cat: 'Misterio', title: `¿Por qué Casi Nadie Habla de ${t}? (La Verdad)` },
      { cat: 'Listas', title: `7 Pasos para Dominar ${t} en 2026 (Sin Experiencia)` },
      { cat: 'Alerta', title: `El Grave Error que Arruina tus Resultados en ${t}` },
      { cat: 'Provocador', title: `Deja de Hacer Esto en ${t} y Empieza con Este Método` },
      { cat: 'Tutorial', title: `Cómo Dominar ${t} desde Cero (Guía Definitiva y Fácil)` },
      { cat: 'Reto', title: `Probé ${t} Durante 30 Días y Esto Fue lo que Pasó` },
    ];

    const results = templates.map((item, idx) => ({
      id: `title-${idx}`,
      cat: item.cat,
      title: item.title,
      analysis: analyzeTitle(item.title)
    }));

    setGeneratedTitles(results);
    if (!customTitle) setCustomTitle(results[0].title);
  };

  // --- LÓGICA DE GUIONES ---
  const handleGenerateScript = () => {
    if (!scriptTopic.trim()) {
      toast({ title: 'Escribe el tema del guión', variant: 'destructive' });
      return;
    }
    const topic = scriptTopic.trim();
    setScriptResult({
      hook: `¿Sabías que la mayoría comete el mismo error al empezar con ${topic}? En este vídeo vas a descubrir exactamente cómo resolverlo paso a paso.`,
      intro: `Hola a todos. Hoy vamos a desglosar todo lo que necesitas saber sobre ${topic}, especialmente pensado para ${scriptAudience}. Al final de este vídeo tendrás un plan de acción claro.`,
      sections: [
        {
          num: 1,
          heading: `El Fundamento: Lo que debes entender sobre ${topic}`,
          content: `Antes de ejecutar cualquier técnica, es vital entender el principio básico. La razón por la que muchos fallan es por saltarse esta primera fase...`,
          tip: 'Mostrar captura o ejemplo visual en pantalla para retener la atención.'
        },
        {
          num: 2,
          heading: `Paso a Paso Práctico: Implementación en 3 fases`,
          content: `Fase 1: Configuración inicial. Fase 2: Ejecución y optimización. Fase 3: Medición de resultados. Cada fase no debería tomarte más de 15 minutos si sigues esta pauta.`,
          tip: 'Utilizar efectos de zoom o transiciones de texto con palabras clave.'
        },
        {
          num: 3,
          heading: `El Secreto de los Expertos para Multiplicar Resultados`,
          content: `Aquí es donde se marca la diferencia real entre quien consigue resultados y quien se queda estancado: la consistencia y el análisis semanal.`,
          tip: 'Cambiar el tono de voz para crear contraste e intriga.'
        }
      ],
      cta: `Si este contenido te ha servido, suscríbete para no perderte el próximo análisis. Déjame en los comentarios tu mayor duda sobre ${topic} y te responderé personalmente. ¡Nos vemos en el próximo vídeo!`
    });
  };

  // --- LÓGICA DE DESCRIPCIONES ---
  const handleGenerateDesc = () => {
    if (!descTitle.trim()) {
      toast({ title: 'Escribe el título o tema del vídeo', variant: 'destructive' });
      return;
    }
    const t = descTitle.trim();
    const desc = `En este vídeo analizamos a fondo todo sobre ${t}. Descubre la guía definitiva con estrategias probadas, consejos prácticos y los errores comunes que debes evitar para maximizar tus resultados en YouTube.

📌 CAPÍTULOS DEL VÍDEO (Marcas de tiempo):
00:00 - Introducción y lo que aprenderás
01:15 - El mayor error que debes evitar
03:40 - Estrategia paso a paso explicada
07:20 - Caso práctico y resultados reales
10:45 - Conclusión y próximos pasos recomendados

🔗 ENLACES DE INTERÉS:
👉 Suscríbete al canal para más contenido semanal: https://youtube.com
👉 Recursos y plantillas gratuitas: https://ejemplo.com/recursos

💬 Cuéntame en los comentarios: ¿Cuál ha sido tu experiencia con ${t}?

#YouTubeTips #${t.replace(/\s+/g, '')} #CrecimientoYouTube #MarketingDigital`;

    setDescResult(desc);
  };

  // --- LÓGICA DE ETIQUETAS (TAGS) ---
  const handleGenerateTags = () => {
    if (!tagTopic.trim()) {
      toast({ title: 'Escribe una palabra clave principal', variant: 'destructive' });
      return;
    }
    const base = tagTopic.trim().toLowerCase();
    const words = base.split(' ').filter(Boolean);

    const generated = [
      base,
      `como hacer ${base}`,
      `tutorial ${base}`,
      `${base} 2026`,
      `${base} para principiantes`,
      `trucos ${base}`,
      `${base} paso a paso`,
      `guia ${base}`,
      `errores ${base}`,
      `mejores estrategias ${base}`,
      `${base} facil`,
      `aprender ${base}`,
      ...words.filter(w => w.length > 3)
    ];

    const unique = [...new Set(generated)];
    setTagsList(unique.map((text, idx) => ({
      text,
      selected: true,
      score: Math.floor(90 - (idx * 2) + Math.random() * 5)
    })));
  };

  const selectedTagsString = tagsList.filter(t => t.selected).map(t => t.text).join(', ');
  const tagsCharCount = selectedTagsString.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            Estudio de Video & Optimización CTR
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Herramientas avanzadas de publicación estilo vidIQ: Títulos, Guiones, Descripciones y Etiquetas SEO.
          </p>
        </div>
      </div>

      <Tabs defaultValue="titles" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="titles" className="py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" /> Títulos & CTR
          </TabsTrigger>
          <TabsTrigger value="scripts" className="py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" /> Guiones de Retención
          </TabsTrigger>
          <TabsTrigger value="descriptions" className="py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" /> Descripciones & Capítulos
          </TabsTrigger>
          <TabsTrigger value="tags" className="py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5">
            <Tags className="w-4 h-4 text-emerald-500" /> Etiquetas YouTube Studio
          </TabsTrigger>
        </TabsList>

        {/* ==================== SUBPESTAÑA 1: TÍTULOS & CTR ==================== */}
        <TabsContent value="titles" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" /> Medidor de CTR en Tiempo Real
              </CardTitle>
              <CardDescription>
                Analiza tu título en vivo según longitud ideal para móviles, palabras de poder y estimación de CTR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Escribe o pega tu título aquí para analizar su CTR..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="pr-24 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-muted-foreground">
                  {titleAnalysis.len} / 60 car.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Puntuación CTR:</span>
                  <Badge variant={titleAnalysis.score >= 80 ? 'default' : titleAnalysis.score >= 60 ? 'secondary' : 'destructive'} className="font-bold text-sm">
                    {titleAnalysis.score} / 100
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Visibilidad Móvil:</span>
                  <Badge variant={titleAnalysis.isMobileIdeal ? 'outline' : 'secondary'} className={titleAnalysis.isMobileIdeal ? 'text-emerald-500 border-emerald-500/30' : 'text-amber-500'}>
                    {titleAnalysis.len === 0 ? 'Sin datos' : titleAnalysis.isMobileIdeal ? '✅ Óptimo (<60 car)' : '⚠️ Se corta en móvil'}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Palabras de Poder:</span>
                  <Badge variant="outline" className="font-semibold text-primary">
                    {titleAnalysis.powerWordsCount} detectadas
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generador de Variaciones */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Generador de Variaciones de Alto Gancho</CardTitle>
              <CardDescription>
                Crea combinaciones de curiosidad, listas, advertencias y tutoriales probadas para YouTube.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Ej: Invertir en bolsa, Crear canal de YouTube, Entrenar en casa..."
                  value={titleTopic}
                  onChange={(e) => setTitleTopic(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleGenerateTitles} className="gap-2 shrink-0">
                  <Sparkles className="w-4 h-4" /> Generar Fórmulas
                </Button>
              </div>

              {generatedTitles.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {generatedTitles.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card/60 hover:bg-card transition-colors gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase shrink-0">
                          {item.cat}
                        </Badge>
                        <span className="font-medium text-sm truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        <Badge variant="outline" className="text-xs font-bold text-primary">
                          CTR {item.analysis.score}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setCustomTitle(item.title)}>
                          Probar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleCopy(item.title, item.id)}>
                          {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SUBPESTAÑA 2: GUIONES ==================== */}
        <TabsContent value="scripts" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Generador de Guiones de Alta Retención
              </CardTitle>
              <CardDescription>
                Estructura psicológica para mantener al espectador pegado a la pantalla durante todo el vídeo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Tema o título del vídeo (Ej: Cómo ahorrar tus primeros 10.000€)..."
                    value={scriptTopic}
                    onChange={(e) => setScriptTopic(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Público objetivo (Ej: Principiantes, Estudiantes)..."
                    value={scriptAudience}
                    onChange={(e) => setScriptAudience(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleGenerateScript} className="gap-2">
                <Sparkles className="w-4 h-4" /> Generar Estructura de Guión
              </Button>

              {scriptResult && (
                <div className="space-y-4 pt-4">
                  {/* Hook */}
                  <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-amber-500 flex items-center gap-1.5">
                        <Flame className="w-4 h-4" /> Gancho Inicial (0 a 5 Segundos)
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(scriptResult.hook, 'hook')}>
                        {copiedId === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <p className="text-sm font-medium">{scriptResult.hook}</p>
                    <p className="text-[11px] text-muted-foreground">Regla de oro: No saludes ni pongas intro larga aquí. Plantea el problema de inmediato.</p>
                  </div>

                  {/* Intro */}
                  <div className="p-4 rounded-lg border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-primary">Introducción y Promesa (5 a 25 Segundos)</span>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(scriptResult.intro, 'intro')}>
                        {copiedId === 'intro' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <p className="text-sm text-foreground/90">{scriptResult.intro}</p>
                  </div>

                  {/* Bloques de desarrollo */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Bloques de Contenido Principal:</span>
                    {scriptResult.sections.map((sec: any) => (
                      <div key={sec.num} className="p-3.5 rounded-lg border bg-card/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Bloque {sec.num}: {sec.heading}</h4>
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(sec.content, `sec-${sec.num}`)}>
                            {copiedId === `sec-${sec.num}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                        <p className="text-xs text-foreground/80">{sec.content}</p>
                        <p className="text-[11px] text-blue-400">💡 Nota de retención: {sec.tip}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-primary">Llamada a la Acción (CTA) Final</span>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(scriptResult.cta, 'cta')}>
                        {copiedId === 'cta' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <p className="text-sm font-medium">{scriptResult.cta}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SUBPESTAÑA 3: DESCRIPCIONES ==================== */}
        <TabsContent value="descriptions" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" /> Generador de Descripciones con Capítulos (SEO)
              </CardTitle>
              <CardDescription>
                Crea descripciones profesionales con marcas de tiempo (capítulos de YouTube), enlaces y hashtags.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Título o tema del vídeo para generar la descripción..."
                  value={descTitle}
                  onChange={(e) => setDescTitle(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleGenerateDesc} className="gap-2 shrink-0">
                  <Sparkles className="w-4 h-4" /> Generar Descripción
                </Button>
              </div>

              {descResult && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Descripción Completa Formateada:</span>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleCopy(descResult, 'desc-full')}>
                      {copiedId === 'desc-full' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      Copiar Descripción
                    </Button>
                  </div>
                  <Textarea
                    rows={12}
                    value={descResult}
                    onChange={(e) => setDescResult(e.target.value)}
                    className="font-mono text-xs leading-relaxed"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SUBPESTAÑA 4: ETIQUETAS YOUTUBE STUDIO ==================== */}
        <TabsContent value="tags" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tags className="w-5 h-5 text-emerald-500" /> Etiquetas Listas para YouTube Studio
              </CardTitle>
              <CardDescription>
                Genera etiquetas relevantes con formato separado por comas para pegar en un solo clic en Studio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Palabra clave central (Ej: Python desde cero, Creación de contenido)..."
                  value={tagTopic}
                  onChange={(e) => setTagTopic(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleGenerateTags} className="gap-2 shrink-0">
                  <Sparkles className="w-4 h-4" /> Generar Tags
                </Button>
              </div>

              {tagsList.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-muted/40">
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">Etiquetas: </span>
                      <span className="text-muted-foreground">{tagsList.filter(t => t.selected).length} de {tagsList.length} seleccionadas</span>
                      <span className="mx-2">•</span>
                      <span className={tagsCharCount > 500 ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                        {tagsCharCount} / 500 caracteres
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="gap-2 shrink-0"
                      onClick={() => handleCopy(selectedTagsString, 'tags-btn')}
                    >
                      {copiedId === 'tags-btn' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      Copiar Formato YouTube Studio
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tagsList.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant={tag.selected ? 'default' : 'outline'}
                        className="cursor-pointer py-1.5 px-3 text-xs gap-1.5 transition-all select-none"
                        onClick={() => {
                          setTagsList(prev => prev.map((t, i) => i === idx ? { ...t, selected: !t.selected } : t));
                        }}
                      >
                        {tag.text}
                        <span className="opacity-60 text-[10px]">({tag.score})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
