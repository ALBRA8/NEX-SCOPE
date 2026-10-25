'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Copy, Check, ExternalLink, Cpu, FileJson } from 'lucide-react';
import { AutomationExportPayload } from '@/lib/types';

interface ExportToAutomationButtonProps {
  payload: Partial<AutomationExportPayload>;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export function ExportToAutomationButton({
  payload,
  buttonVariant = 'default',
  buttonSize = 'sm',
  className = '',
  label = '🚀 Enviar a Fábrica',
}: ExportToAutomationButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [mode, setMode] = useState<'idea' | 'script' | 'url' | 'audio'>(payload.recommended_mode || 'idea');
  const [format, setFormat] = useState<'short' | 'long'>(payload.target_format || 'long');

  const fullPayload: AutomationExportPayload = {
    title: payload.title || 'Sin título',
    hook: payload.hook || 'Gancho de alto impacto para los primeros 5-30s.',
    idea_summary: payload.idea_summary || 'Resumen de inteligencia y ángulo de producción generado por NEX-SCOPE.',
    target_rpm: payload.target_rpm || 15.0,
    reference_url: payload.reference_url || '',
    recommended_mode: mode,
    target_format: format,
    generated_at: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(fullPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast({
      title: '¡Payload copiado al portapapeles!',
      description: 'Listo para pegar en YouTube Automation.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchLocal = () => {
    const prefillData = encodeURIComponent(JSON.stringify(fullPayload));
    const url = `http://127.0.0.1:8000/?prefill=${prefillData}`;
    window.open(url, '_blank');
    toast({
      title: 'Invocando YouTube Automation...',
      description: 'Abriendo fábrica local en http://127.0.0.1:8000',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={`gap-1.5 font-semibold text-xs shadow-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border-0 ${className}`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>{label}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Puente NEX-SCOPE ➔ YouTube Automation
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Transfiere esta inteligencia de mercado directamente a la fábrica de producción (FFmpeg, Whisper, EdgeTTS).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Selectores de Modalidad */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                Modalidad en Fábrica:
              </label>
              <Select value={mode} onValueChange={(val: any) => setMode(val)}>
                <SelectTrigger className="h-8 bg-neutral-950 border-neutral-700 text-xs">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="idea">💡 Desde Idea (Guión + TTS + Clips)</SelectItem>
                  <SelectItem value="script">📝 Desde Guion</SelectItem>
                  <SelectItem value="url">🔗 Desde URL (Clipper / Clonación)</SelectItem>
                  <SelectItem value="audio">🎙️ Desde Audio (Voz en off)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                Formato de Salida:
              </label>
              <Select value={format} onValueChange={(val: any) => setFormat(val)}>
                <SelectTrigger className="h-8 bg-neutral-950 border-neutral-700 text-xs">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="long">📺 Long-form (16:9 Vídeo Horizontal)</SelectItem>
                  <SelectItem value="short">📱 Short / Reel (9:16 Vertical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ficha Resumen de Inteligencia */}
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Título para Producción:</span>
              <Badge variant="outline" className="text-[10px] font-semibold text-emerald-400 border-emerald-500/30">
                RPM Estimado: ${fullPayload.target_rpm.toFixed(1)}
              </Badge>
            </div>
            <p className="font-semibold text-neutral-200">{fullPayload.title}</p>
            {fullPayload.hook && (
              <p className="text-[11px] text-amber-300 italic">
                &ldquo;{fullPayload.hook}&rdquo;
              </p>
            )}
          </div>

          {/* Contrato JSON */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <FileJson className="w-3.5 h-3.5 text-amber-500" /> Contrato JSON para YouTube Automation:
              </span>
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-xs gap-1 text-neutral-300">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <pre className="p-3 rounded-lg bg-neutral-900 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-48 border border-neutral-800">
              {jsonString}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-neutral-800">
          <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" /> Copiar JSON
          </Button>
          <Button
            size="sm"
            onClick={handleLaunchLocal}
            className="gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir en Fábrica Local (http://127.0.0.1:8000)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
