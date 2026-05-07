'use client';

import { useState } from 'react';
import { niches } from '@/lib/mock-data';
import { TrendSparkline } from '@/components/shared/TrendSparkline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, ArrowUpRight, Clock, Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const categoryTabs = [
  'Todas', 'Tecnología', 'Finanzas', 'Salud', 'Entretenimiento',
  'Educación', 'Gaming', 'Cocina', 'Viajes',
];

function getTimeBadge(velocity: number): { label: string; color: string } {
  if (velocity >= 85) return { label: 'Nuevo', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
  if (velocity >= 70) return { label: '1 semana', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  if (velocity >= 50) return { label: '1 mes', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  return { label: '3 meses', color: 'bg-muted text-muted-foreground' };
}

export function TrendsView() {
  const [activeTab, setActiveTab] = useState('Todas');
  const trendingNiches = niches
    .filter(n => n.trending)
    .sort((a, b) => b.trendVelocity - a.trendVelocity);

  const filtered = activeTab === 'Todas'
    ? trendingNiches
    : trendingNiches.filter(n => n.category === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tendencias</h2>
        <p className="text-muted-foreground text-sm">Nichos en tendencia y su velocidad de crecimiento</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {categoryTabs.map(tab => (
            <TabsTrigger key={tab} value={tab} className="text-xs">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((niche, i) => {
              const timeInfo = getTimeBadge(niche.trendVelocity);
              return (
                <motion.div
                  key={niche.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Flame className={cn('w-4 h-4', niche.trendVelocity >= 80 ? 'text-rose-500' : 'text-amber-500')} />
                            <h3 className="font-semibold text-sm">{niche.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{niche.category}</p>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px]', timeInfo.color)}>
                          <Clock className="w-3 h-3 mr-1" />
                          {timeInfo.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <TrendSparkline
                          data={niche.growthRate > 30
                            ? [20, 25, 30, 35, 42, 50, 58, 68, 78, 90, 105, 120]
                            : [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62]
                          }
                          color={niche.trendVelocity >= 70 ? '#10b981' : '#f59e0b'}
                          width={100}
                          height={35}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Crecimiento</span>
                            <span className="font-semibold text-emerald-500 flex items-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" />
                              {niche.growthRate}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Velocidad</span>
                            <span className="font-semibold">{niche.trendVelocity}/100</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Niche Score</span>
                            <span className="font-semibold">{niche.nicheScore}/100</span>
                          </div>
                        </div>
                      </div>

                      {/* Velocity bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Velocidad de tendencia</span>
                          <span className="text-[10px] font-medium">{niche.trendVelocity}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              niche.trendVelocity >= 80 ? 'bg-rose-500' :
                              niche.trendVelocity >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${niche.trendVelocity}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay tendencias en esta categoría</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
