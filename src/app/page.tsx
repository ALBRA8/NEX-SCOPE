'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppStore } from '@/lib/store';
import { LandingPage } from '@/components/LandingPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Separator } from '@/components/ui/separator';
import { Radar, Loader2 } from 'lucide-react';

// Dynamic imports for views that use Recharts (SSR issues)
const DashboardView = lazy(() => import('@/components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const NicheFinderView = lazy(() => import('@/components/views/NicheFinderView').then(m => ({ default: m.NicheFinderView })));
const TrendsView = lazy(() => import('@/components/views/TrendsView').then(m => ({ default: m.TrendsView })));
const ChannelAnalyzerView = lazy(() => import('@/components/views/ChannelAnalyzerView').then(m => ({ default: m.ChannelAnalyzerView })));
const ContentGapView = lazy(() => import('@/components/views/ContentGapView').then(m => ({ default: m.ContentGapView })));
const MonetizationView = lazy(() => import('@/components/views/MonetizationView').then(m => ({ default: m.MonetizationView })));
const CompetitorMatrixView = lazy(() => import('@/components/views/CompetitorMatrixView').then(m => ({ default: m.CompetitorMatrixView })));
const ContentPlanView = lazy(() => import('@/components/views/ContentPlanView').then(m => ({ default: m.ContentPlanView })));
const KeywordExplorerView = lazy(() => import('@/components/views/KeywordExplorerView').then(m => ({ default: m.KeywordExplorerView })));
const AIChatView = lazy(() => import('@/components/views/AIChatView').then(m => ({ default: m.AIChatView })));
const SettingsView = lazy(() => import('@/components/views/SettingsView').then(m => ({ default: m.SettingsView })));

const viewLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  'niche-finder': 'Buscador de Nichos',
  trends: 'Tendencias',
  'channel-analyzer': 'Análisis de Canal',
  'content-gap': 'Brechas de Contenido',
  monetization: 'Estimador de Monetización',
  'competitor-matrix': 'Matriz de Competencia',
  'content-plan': 'Plan de Contenido',
  'keyword-explorer': 'Explorador de Keywords',
  'ai-chat': 'Asistente IA',
  'settings': 'Configuración',
};

function ViewLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando vista...</p>
      </div>
    </div>
  );
}

function ViewRenderer({ activeView }: { activeView: string }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ViewLoadingFallback />}>
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'niche-finder' && <NicheFinderView />}
        {activeView === 'trends' && <TrendsView />}
        {activeView === 'channel-analyzer' && <ChannelAnalyzerView />}
        {activeView === 'content-gap' && <ContentGapView />}
        {activeView === 'monetization' && <MonetizationView />}
        {activeView === 'competitor-matrix' && <CompetitorMatrixView />}
        {activeView === 'content-plan' && <ContentPlanView />}
        {activeView === 'keyword-explorer' && <KeywordExplorerView />}
        {activeView === 'ai-chat' && <AIChatView />}
        {activeView === 'settings' && <SettingsView />}
        {!['dashboard','niche-finder','trends','channel-analyzer','content-gap','monetization','competitor-matrix','content-plan','keyword-explorer','ai-chat','settings'].includes(activeView) && <DashboardView />}
      </Suspense>
    </ErrorBoundary>
  );
}

function Dashboard() {
  const activeView = useAppStore((s) => s.activeView);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground">
                  <Radar className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-sm font-semibold">{viewLabels[activeView] || 'Dashboard'}</h1>
              </div>
            </div>
            <ThemeToggle />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <ViewRenderer activeView={activeView} />
          </main>

          {/* Footer */}
          <footer className="border-t border-border/50 px-4 py-2 text-center">
            <p className="text-[10px] text-muted-foreground">
              NexScope &copy; 2026 &middot; Potenciado por IA
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
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

export default function Home() {
  const { isAuthenticated, isHydrated, initAuth } = useAppStore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    initAuth();
  }, [initAuth]);

  // Show loading until client-side hydration is complete
  if (!hasMounted || !isHydrated) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
