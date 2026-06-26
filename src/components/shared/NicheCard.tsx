'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreIndicator } from './ScoreIndicator';
import { Niche } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Bookmark, BookmarkCheck, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NicheCardProps {
  niche: Niche;
  onAnalyze?: (niche: Niche) => void;
}

export function NicheCard({ niche, onAnalyze }: NicheCardProps) {
  const { savedNiches, toggleSavedNiche } = useAppStore();
  const isSaved = savedNiches.includes(niche.id);

  const competitionColor = {
    bajo: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    medio: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    alto: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{niche.name}</h3>
                {niche.trending && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0">
                    <TrendingUp className="w-3 h-3 mr-0.5" />Trend
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{niche.category}</p>
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => toggleSavedNiche(niche)}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <ScoreIndicator score={niche.nicheScore} size="sm" showLabel={false} />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">RPM Est.</span>
                <span className="font-semibold flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />{niche.estimatedRPM.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Crecimiento</span>
                <span className="font-semibold text-emerald-500">+{niche.growthRate}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Suscriptores</span>
                <span className="font-semibold">{niche.subscriberRange}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn('text-[10px]', competitionColor[niche.competitionLevel])}>
              Competencia {niche.competitionLevel}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => onAnalyze?.(niche)}
            >
              Analizar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
