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
  Puzzle,
  DollarSign,
  Swords,
  CalendarDays,
  KeyRound,
  Bot,
  Radar,
  LogOut,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'niche-finder', label: 'Buscador de Nichos', icon: Search },
  { id: 'trends', label: 'Tendencias', icon: TrendingUp },
  { id: 'channel-analyzer', label: 'Análisis de Canal', icon: Tv },
  { id: 'content-gap', label: 'Brechas de Contenido', icon: Puzzle },
  { id: 'monetization', label: 'Estimador Monetización', icon: DollarSign },
  { id: 'competitor-matrix', label: 'Matriz de Competencia', icon: Swords },
  { id: 'content-plan', label: 'Plan de Contenido', icon: CalendarDays },
  { id: 'keyword-explorer', label: 'Explorador Keywords', icon: KeyRound },
  { id: 'ai-chat', label: 'Agente IA', icon: Bot },
];

export function AppSidebar() {
  const { activeView, setActiveView, user, logout } = useAppStore();

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email
      ? user.email[0].toUpperCase()
      : '?';

  const userEmail = user?.email
    ? user.email.length > 20
      ? user.email.slice(0, 20) + '...'
      : user.email
    : '';

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Radar className="w-5 h-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="font-bold text-lg leading-none">NexScope</h1>
            <p className="text-[10px] text-muted-foreground">YouTube Niche Finder</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Herramientas
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

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('settings')}
                  className={cn(
                    'transition-all duration-200',
                    activeView === 'settings' && 'bg-primary/10 text-primary font-semibold'
                  )}
                  tooltip="Configuración"
                >
                  <Settings className={cn(
                    'w-4 h-4',
                    activeView === 'settings' && 'text-primary'
                  )} />
                  <span className="group-data-[collapsible=icon]:hidden">Configuración</span>
                  {activeView === 'settings' && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary group-data-[collapsible=icon]:hidden" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* User info */}
        <div className="group-data-[collapsible=icon]:hidden mb-3">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-600 text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 justify-start gap-2 text-xs"
            onClick={() => { logout(); }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Collapsed icon mode - just show avatar */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-500/20 text-emerald-600 text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="group-data-[collapsible=icon]:hidden mt-2">
          <p className="text-[10px] text-muted-foreground text-center">
            NexScope © 2026
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
