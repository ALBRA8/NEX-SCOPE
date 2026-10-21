'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Smartphone,
  Monitor,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  SplitSquareVertical,
  Check
} from 'lucide-react';

export function FeedSimulatorView() {
  const { toast } = useToast();
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isAbMode, setIsAbMode] = useState(false);

  // Datos del simulador
  const [title, setTitle] = useState('Creé un Negocio con Inteligencia Artificial en 24 Horas (Resultados Reales)');
  const [channelName, setChannelName] = useState('Mi Canal de YouTube');
  const [views, setViews] = useState('145 K vistas');
  const [uploadTime, setUploadTime] = useState('hace 2 días');
  const [duration, setDuration] = useState('12:44');

  // Miniaturas
  const [thumbA, setThumbA] = useState<string>('linear-gradient(135deg, #1e3a8a, #3b82f6)');
  const [thumbB, setThumbB] = useState<string>('linear-gradient(135deg, #701a75, #ec4899)');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Por favor sube una imagen válida', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (target === 'A') setThumbA(`url('${result}')`);
      else setThumbB(`url('${result}')`);
      toast({ title: `Miniatura ${target} actualizada`, description: 'Visualízala en la vista previa.' });
    };
    reader.readAsDataURL(file);
  };

  const isTitleTooLong = title.length > 60;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-primary" />
            Simulador de Feed de YouTube
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Comprueba en tiempo real cómo destacará tu miniatura y título en la pantalla de inicio de tus espectadores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isAbMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAbMode(!isAbMode)}
            className="gap-2"
          >
            <SplitSquareVertical className="w-4 h-4" />
            {isAbMode ? 'Desactivar Comparativa A/B' : 'Test A/B de Miniaturas'}
          </Button>

          <Tabs value={deviceMode} onValueChange={(v: any) => setDeviceMode(v)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="desktop" className="gap-1.5 text-xs">
                <Monitor className="w-3.5 h-3.5" /> Ordenador
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-1.5 text-xs">
                <Smartphone className="w-3.5 h-3.5" /> Móvil
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel de Controles (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Metadatos del Vídeo</CardTitle>
              <CardDescription>Edita el contenido simulado para ver los cambios al instante.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-muted-foreground">Título del vídeo</span>
                  <span className={isTitleTooLong ? 'text-amber-500 font-bold' : 'text-muted-foreground'}>
                    {title.length} car. {isTitleTooLong && '(se corta en móvil)'}
                  </span>
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Escribe el título..."
                  className="font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Nombre de canal</span>
                  <Input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Duración</span>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="12:44"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Visualizaciones</span>
                  <Input
                    value={views}
                    onChange={(e) => setViews(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Fecha de publicación</span>
                  <Input
                    value={uploadTime}
                    onChange={(e) => setUploadTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Subida de Miniatura A */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Miniatura Principal (A)</span>
                  <label className="cursor-pointer text-primary hover:underline text-xs flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Subir archivo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'A')} />
                  </label>
                </span>
                <div className="flex gap-2">
                  {[
                    'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    'linear-gradient(135deg, #701a75, #ec4899)',
                    'linear-gradient(135deg, #064e3b, #10b981)',
                    'linear-gradient(135deg, #7c2d12, #f97316)',
                  ].map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setThumbA(bg)}
                      style={{ background: bg }}
                      className="w-8 h-8 rounded-md border border-white/20 hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
              </div>

              {/* Subida de Miniatura B (si está en A/B) */}
              {isAbMode && (
                <div className="pt-2 space-y-2 border-t">
                  <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Miniatura de Prueba (B)</span>
                    <label className="cursor-pointer text-primary hover:underline text-xs flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Subir archivo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'B')} />
                    </label>
                  </span>
                  <div className="flex gap-2">
                    {[
                      'linear-gradient(135deg, #312e81, #8b5cf6)',
                      'linear-gradient(135deg, #831843, #f43f5e)',
                      'linear-gradient(135deg, #134e4a, #14b8a6)',
                      'linear-gradient(135deg, #78350f, #d97706)',
                    ].map((bg, idx) => (
                      <button
                        key={idx}
                        onClick={() => setThumbB(bg)}
                        style={{ background: bg }}
                        className="w-8 h-8 rounded-md border border-white/20 hover:scale-105 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel de Visualización (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-start">
          <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-neutral-800 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-200">Previsualización de YouTube ({deviceMode.toUpperCase()})</span>
              <span className="flex items-center gap-1.5">
                {isTitleTooLong ? (
                  <Badge variant="secondary" className="text-amber-400 bg-amber-400/10 text-[10px] gap-1">
                    <AlertTriangle className="w-3 h-3" /> El título puede truncarse
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-emerald-400 bg-emerald-400/10 text-[10px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Longitud visual óptima
                  </Badge>
                )}
              </span>
            </div>

            <div className={`w-full flex flex-col gap-6 ${isAbMode ? 'md:grid md:grid-cols-2' : ''}`}>
              {/* Tarjeta A */}
              <div className={`flex flex-col gap-3 mx-auto ${deviceMode === 'mobile' ? 'max-w-[340px]' : 'max-w-[440px]'}`}>
                {isAbMode && <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Variante A</span>}
                <div
                  className="w-full aspect-video rounded-xl relative overflow-hidden shadow-lg border border-neutral-800 bg-cover bg-center"
                  style={{ background: thumbA, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <span className="absolute bottom-2 right-2 bg-black/85 text-white font-bold text-[11px] px-1.5 py-0.5 rounded">
                    {duration}
                  </span>
                </div>
                <div className="flex gap-3 px-1">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shrink-0">
                    {channelName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-semibold text-neutral-100 text-sm leading-snug line-clamp-2">
                      {title}
                    </h4>
                    <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
                      <span className="truncate">{channelName}</span>
                      <Check className="w-3 h-3 text-neutral-400 inline" />
                    </div>
                    <span className="text-xs text-neutral-400 mt-0.5">
                      {views} • {uploadTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta B (si está en modo A/B) */}
              {isAbMode && (
                <div className={`flex flex-col gap-3 mx-auto ${deviceMode === 'mobile' ? 'max-w-[340px]' : 'max-w-[440px]'}`}>
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Variante B</span>
                  <div
                    className="w-full aspect-video rounded-xl relative overflow-hidden shadow-lg border border-neutral-800 bg-cover bg-center"
                    style={{ background: thumbB, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    <span className="absolute bottom-2 right-2 bg-black/85 text-white font-bold text-[11px] px-1.5 py-0.5 rounded">
                      {duration}
                    </span>
                  </div>
                  <div className="flex gap-3 px-1">
                    <div className="w-9 h-9 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {channelName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-semibold text-neutral-100 text-sm leading-snug line-clamp-2">
                        {title}
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
                        <span className="truncate">{channelName}</span>
                        <Check className="w-3 h-3 text-neutral-400 inline" />
                      </div>
                      <span className="text-xs text-neutral-400 mt-0.5">
                        {views} • {uploadTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
