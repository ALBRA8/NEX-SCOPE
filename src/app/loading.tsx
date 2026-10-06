// Standard Next.js App Router loading UI for the root segment. Shown while
// server components in the layout are streaming in. Kept minimal and themed
// consistently with the rest of the app (see LoadingScreen in src/app/page.tsx).

import { Radar, Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground animate-pulse">
          <Radar className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando NexScope...</span>
        </div>
      </div>
    </div>
  );
}
