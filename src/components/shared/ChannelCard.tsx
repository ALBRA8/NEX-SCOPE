'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Channel } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Bookmark, BookmarkCheck, Eye, Video, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChannelCardProps {
  channel: Channel;
  onSelect?: (channel: Channel) => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function ChannelCard({ channel, onSelect }: ChannelCardProps) {
  const { savedChannels, toggleSavedChannel } = useAppStore();
  const isSaved = savedChannels.includes(channel.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
              {channel.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => toggleSavedChannel(channel)}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4 h-4 text-primary" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{channel.niche}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Users className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-semibold">{formatNumber(channel.subscribers)}</p>
              <p className="text-[10px] text-muted-foreground">Suscriptores</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-semibold">{formatNumber(channel.totalViews)}</p>
              <p className="text-[10px] text-muted-foreground">Vistas totales</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Video className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-semibold">{channel.videoCount}</p>
              <p className="text-[10px] text-muted-foreground">Videos</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px]">
                Eng: {channel.engagementRate}%
              </Badge>
              <Badge variant="outline" className="text-[10px] text-emerald-500">
                ${formatNumber(channel.estimatedRevenue)}/mes
              </Badge>
            </div>
            <Button
              size="sm" variant="outline"
              className="text-xs h-7"
              onClick={() => onSelect?.(channel)}
            >
              Ver Detalle
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
