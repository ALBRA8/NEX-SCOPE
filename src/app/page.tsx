'use client';

import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppStore } from '@/lib/store';
import { LandingPage } from '@/components/LandingPage';
import { DashboardView } from '@/components/views/DashboardView';
import { NicheFinderView } from '@/components/views/NicheFinderView';
import { TrendsView } from '@/components/views/TrendsView';
import { ChannelAnalyzerView } from '@/components/views/ChannelAnalyzerView';
import { ContentGapView } from '@/components/views/ContentGapView';
import { MonetizationView } from '@/components/views/MonetizationView';
import { CompetitorMatrixView } from '@/components/views/CompetitorMatrixView';
import { ContentPlanView } from '@/components/views/ContentPlanView';
import { KeywordExplorerView } from '@/components/views/KeywordExplorerView';
import { AIChatView } from '@/components/views/AIChatView';
import { Separator } from '@/components/ui/separator';
import { Radar, Loader2 } from 'lucide-react';

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
};

function ViewRenderer({ activeView }: { activeView: string }) {
  switch (activeView) {
    case 'dashboard': return <DashboardView />;
    case 'niche-finder': return <NicheFinderView />;
    case 'trends': return <TrendsView />;
    case 'channel-analyzer': return <ChannelAnalyzerView />;
    case 'content-gap': return <ContentGapView />;
    case 'monetization': return <MonetizationView />;
    case 'competitor-matrix': return <CompetitorMatrixView />;
    case 'content-plan': return <ContentPlanView />;
    case 'keyword-explorer': return <KeywordExplorerView />;
    case 'ai-chat': return <AIChatView />;
    default: return <DashboardView />;
  }
}

function Dashboard() {
  const activeView = useAppStore((s) => s.activeView);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground">
                  <Radar className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-sm font-semibold">{viewLabels[activeView]}</h1>
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
              NicheScope &copy; 2026 &middot; Potenciado por IA
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
          <span className="text-sm">Cargando NicheScope...</span>
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

  return <Dashboard />;
}
