'use client';

import { useYouTubeApi } from '@/hooks/use-youtube-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';

export function ApiKeyStatus() {
  const { status, refreshStatus } = useYouTubeApi();

  if (status.loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Verificando API...</span>
        </CardContent>
      </Card>
    );
  }

  if (!status.configured) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-amber-600">API de YouTube no configurada</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega tu <code className="px-1 py-0.5 bg-muted rounded text-xs">YOUTUBE_API_KEY</code> al archivo{' '}
                <code className="px-1 py-0.5 bg-muted rounded text-xs">.env.local</code> para habilitar datos reales de YouTube.
              </p>
              <div className="mt-2 p-2 bg-muted/50 rounded text-[10px] font-mono text-muted-foreground">
                YOUTUBE_API_KEY=tu_api_key_aqui
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Mientras tanto, se usan datos de demostración.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status.valid) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-red-600">API Key inválida</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {status.error || 'La API key no es válida o ha expirado. Verifica tu configuración.'}
              </p>
              <Button variant="outline" size="sm" className="mt-2 text-xs h-7" onClick={refreshStatus}>
                Reintentar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-emerald-600">API de YouTube activa</h4>
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">Conectada</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Datos reales de YouTube disponibles
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
