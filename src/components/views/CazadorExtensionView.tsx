'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CazadorDownloadButton } from '@/components/shared/CazadorDownloadButton';
import { Zap, Youtube, MousePointerClick, ShieldCheck, Download } from 'lucide-react';

export function CazadorExtensionView() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur shrink-0">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Extensión CAZADOR</h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Captura ofertas de afiliados y canales de YouTube en 1 clic. Envíalas directo a NEX-SCOPE con firma HMAC-SHA256.
            </p>
          </div>
        </div>
      </div>

      {/* Main download card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Descargar e instalar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La extensión es un archivo .zip (95 KB) que se carga en Chrome como
            "extensión descomprimida". No requiere Chrome Web Store.
          </p>
          <CazadorDownloadButton size="lg" label="⬇️ Descargar extensión (Chrome)" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-2 rounded-md bg-muted">
              <p className="text-muted-foreground">Versión</p>
              <p className="font-semibold">0.2.0</p>
            </div>
            <div className="p-2 rounded-md bg-muted">
              <p className="text-muted-foreground">Tamaño</p>
              <p className="font-semibold">95 KB</p>
            </div>
            <div className="p-2 rounded-md bg-muted">
              <p className="text-muted-foreground">Chrome</p>
              <p className="font-semibold">109+</p>
            </div>
            <div className="p-2 rounded-md bg-muted">
              <p className="text-muted-foreground">Permisos</p>
              <p className="font-semibold">6 + hosts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">4 menús en YouTube</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Botón derecho sobre cualquier canal o video:
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>🎯 Analizar canal con NEX-SCOPE</li>
                  <li>📌 Guardar nicho en NEX-SCOPE</li>
                  <li>🎬 Enviar a Fábrica de Videos</li>
                  <li>👁️ Espiar anuncios del canal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <MousePointerClick className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Extractores especializados</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Scrapeo preciso (sin IA) de:
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>🟢 JVZoo — marketplace + product library</li>
                  <li>🟠 Hotmart — marketplace + owners</li>
                  <li>🔵 Muncheye — calendario de launches</li>
                  <li>🟣 Dropi — 11 países LATAM</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Seguridad HMAC-SHA256</h3>
                <p className="text-xs text-muted-foreground">
                  Cada señal enviada a NEX-SCOPE va firmada con tu CAZADOR_WEBHOOK_SECRET.
                  Solo tu cuenta puede ingestar señales — un atacante con tu URL no alcanza.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Suggest Fields</h3>
                <p className="text-xs text-muted-foreground">
                  La IA escanea cualquier web y sugiere columnas automáticamente.
                  Score de confianza por columna (anti-alucinación).
                  Export a CSV y Excel real (.xlsx).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installation steps */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instalación paso a paso</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Descarga</strong> el .zip con el botón de arriba.
            </li>
            <li>
              <strong>Descomprime</strong> el .zip en una carpeta permanente (no la borres después).
            </li>
            <li>
              Abre Chrome y ve a <code className="px-1 py-0.5 bg-muted rounded">chrome://extensions</code>
            </li>
            <li>
              Activa el <strong>Modo desarrollador</strong> (switch arriba a la derecha).
            </li>
            <li>
              Click en <strong>"Cargar descomprimida"</strong> → selecciona la carpeta donde descomprimiste.
            </li>
            <li>
              Aparece el icono <Zap className="inline w-3 h-3" /> ⚡ en la lista de extensiones. Pínealo en la toolbar.
            </li>
            <li>
              Click en el icono ⚡ → se abre el sidebar lateral.
            </li>
            <li>
              Ve a <strong>"⚙️ Conexión NEX-SCOPE"</strong> al final del sidebar.
            </li>
            <li>
              Configura:
              <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                <li><strong>URL de NEX-SCOPE</strong>: <code className="px-1 py-0.5 bg-muted rounded">http://localhost:3000</code> (o tu dominio)</li>
                <li><strong>CAZADOR_WEBHOOK_SECRET</strong>: el mismo que seteaste en <code className="px-1 py-0.5 bg-muted rounded">.env.local</code> de NEX-SCOPE</li>
              </ul>
            </li>
            <li>
              Click <strong>"Probar conexión"</strong> → debe decir "Conexión OK".
            </li>
            <li>
              Navega a JVZoo, Hotmart, Muncheye o YouTube y usa el botón derecho para capturar.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Problemas comunes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <p className="font-medium text-foreground">"Probar conexión" falla con 401</p>
            <p className="text-muted-foreground text-xs mt-1">
              No estás logueado en NEX-SCOPE en el mismo Chrome. Abrí una pestaña
              normal, entra a tu NEX-SCOPE, logueate, y volvé a probar.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">"Probar conexión" falla con 401 (signature)</p>
            <p className="text-muted-foreground text-xs mt-1">
              El CAZADOR_WEBHOOK_SECRET de la extensión no coincide con el de
              NEX-SCOPE. Verifica que sean idénticos (sin espacios al final).
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">No aparecen los menús en YouTube</p>
            <p className="text-muted-foreground text-xs mt-1">
              Recargá la pestaña de YouTube después de instalar. Los context menus
              se registran en <code className="px-1 py-0.5 bg-muted rounded">onInstalled</code>,
              así que hasta que no recargas la página no aparecen.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Las señales no llegan a NEX-SCOPE</p>
            <p className="text-muted-foreground text-xs mt-1">
              Verificá en <code className="px-1 py-0.5 bg-muted rounded">/api/mesh/signals</code>
              si las señales están llegando. Si no, revisá la consola del service worker
              (chrome://extensions → "Inspeccionar views: service worker").
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
