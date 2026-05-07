'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAppStore } from '@/lib/store';
import { ViewType } from '@/lib/types';
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Tv,
  Gap,
  DollarSign,
  Swords,
  CalendarDays,
  KeyRound,
  Bot,
  Radar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'niche-finder', label: 'Buscador de Nichos', icon: Search },
  { id: 'trends', label: 'Tendencias', icon: TrendingUp },
  { id: 'channel-analyzer', label: 'Análisis de Canal', icon: Tv },
  { id: 'content-gap', label: 'Brechas de Contenido', icon: Gap },
  { id: 'monetization', label: 'Estimador Monetización', icon: DollarSign },
  { id: 'competitor-matrix', label: 'Matriz de Competencia', icon: Swords },
  { id: 'content-plan', label: 'Plan de Contenido', icon: CalendarDays },
  { id: 'keyword-explorer', label: 'Explorador Keywords', icon: KeyRound },
  { id: 'ai-chat', label: 'Asistente IA', icon: Bot },
];

export function AppSidebar() {
  const { activeView, setActiveView } = useAppStore();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Radar className="w-5 h-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="font-bold text-lg leading-none">NicheScope</h1>
            <p className="text-[10px] text-muted-foreground">YouTube Niche Finder</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      'transition-all duration-200',
                      activeView === item.id && 'bg-primary/10 text-primary font-semibold'
                    )}
                    tooltip={item.label}
                  >
                    <item.icon className={cn(
                      'w-4 h-4',
                      activeView === item.id && 'text-primary'
                    )} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    {activeView === item.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary group-data-[collapsible=icon]:hidden" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <p className="text-[10px] text-muted-foreground text-center">
            NicheScope © 2026
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
