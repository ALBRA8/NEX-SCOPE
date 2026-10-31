'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CazadorDownloadButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
  /** If true, shows install instructions after download starts */
  showInstructions?: boolean;
}

type DownloadState = 'idle' | 'downloading' | 'success' | 'error';

/**
 * Botón de descarga de la extensión CAZADOR (Chrome MV3).
 *
 * Descarga el .zip prebuild desde /api/cazador-download y opcionalmente
 * muestra instrucciones de instalación.
 *
 * La extensión ya viene parcheada con:
 *   - 4 context menus de YouTube (analizar canal, guardar nicho, enviar
 *     a fábrica, espiar anuncios)
 *   - Mesh webhook HMAC-SHA256 hacia NEX-SCOPE
 *   - UI de configuración en el sidebar (URL + secret + probar conexión)
 */
export function CazadorDownloadButton({
  variant = 'default',
  size = 'default',
  className = '',
  label = 'Descargar extensión CAZADOR',
  showInstructions = true,
}: CazadorDownloadButtonProps) {
  const [state, setState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function handleDownload() {
    setState('downloading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/cazador-download');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cazador-extension-v0.2.0.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      setState('error');
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={state === 'downloading'}
      >
        {state === 'downloading' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Descargando…
          </>
        ) : state === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
            ¡Descargado! Verifica tu carpeta de descargas
          </>
        ) : state === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
            Error — reintentar
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>

      {state === 'error' && errorMsg && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}

      {state === 'success' && showInstructions && (
        <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-900 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-100">
          <p className="font-semibold mb-2">📋 Instrucciones de instalación:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Descomprime el .zip en una carpeta permanente</li>
            <li>
              Abre <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">chrome://extensions</code> en Chrome
            </li>
            <li>Activa el <strong>Modo desarrollador</strong> (arriba a la derecha)</li>
            <li>
              Click en <strong>Cargar descomprimida</strong> → selecciona la carpeta descomprimida
            </li>
            <li>Pinea el icono ⚡ en la toolbar</li>
            <li>
              Click en el icono ⚡ → abre el sidebar → ve a <strong>⚙️ Conexión NEX-SCOPE</strong>
            </li>
            <li>
              Configura la URL de tu NEX-SCOPE y el <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">CAZADOR_WEBHOOK_SECRET</code>
            </li>
            <li>
              Navega a JVZoo/Hotmart/Muncheye/YouTube y usa el botón derecho del mouse para capturar
            </li>
          </ol>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            ⚠️ Para que los context menus funcionen en YouTube, debes estar logueado en NEX-SCOPE en la misma sesión de Chrome.
          </p>
        </div>
      )}
    </div>
  );
}
