'use client';

// Standard Next.js App Router error boundary. Catches render-time errors
// thrown by the root layout's server components and any child route segment
// that doesn't define its own error.tsx. The client-side ErrorBoundary in
// src/components/ErrorBoundary.tsx keeps handling view-scope errors so we
// keep this fallback minimal and themed consistently.

import { useEffect } from 'react';
import { Radar } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error server-side via Next's instrumentation hook if you
    // wire one up later. For now, console.error is enough.
    console.error('[NexScope root error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 text-destructive">
          <Radar className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-semibold">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground">
          Se produjo un error inesperado al cargar la página. Intenta de nuevo;
          si el problema persiste, revisa la consola del servidor.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
