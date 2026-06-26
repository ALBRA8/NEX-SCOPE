'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Wifi, WifiOff, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIModeBannerProps {
  available: boolean;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  /**
   * When AI is unavailable, the view falls back to demo data.
   * This callback lets the user explicitly request demo data.
   */
  onUseDemo?: () => void;
  className?: string;
}

/**
 * Compact status banner shown at the top of AI-powered views.
 * Communicates 3 states:
 *   1. AI available (green) — live data
 *   2. AI unavailable (amber) — falling back to demo data
 *   3. Loading (gray) — checking
 */
export function AIModeBanner({
  available,
  loading,
  error,
  onRetry,
  onUseDemo,
  className,
}: AIModeBannerProps) {
  if (loading) {
    return (
      <Card className={cn('border-primary/20 bg-primary/5', className)}>
        <CardContent className="p-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Verificando conexión con la IA…</span>
        </CardContent>
      </Card>
    );
  }

  if (available) {
    return (
      <Card className={cn('border-emerald-500/20 bg-emerald-500/5', className)}>
        <CardContent className="p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-500" />
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600">
              <Sparkles className="w-3 h-3" /> IA en vivo
            </Badge>
            <span className="text-xs text-muted-foreground">
              Las respuestas se generan en tiempo real con Z.ai
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Unavailable
  return (
    <Card className={cn('border-amber-500/30 bg-amber-500/5', className)}>
      <CardContent className="p-3 flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <WifiOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600">
                <AlertTriangle className="w-3 h-3" /> IA no disponible
              </Badge>
              <span className="text-xs text-muted-foreground">
                Mostrando datos de demostración. La IA volverá cuando se restablezca la conexión.
              </span>
            </div>
            {error && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate" title={error}>
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {onUseDemo && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={onUseDemo}>
              Ver demo
            </Button>
          )}
          {onRetry && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={onRetry}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Reintentar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
