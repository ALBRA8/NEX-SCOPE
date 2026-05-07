'use client';

import { cn } from '@/lib/utils';

interface ScoreIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreIndicator({ score, size = 'md', showLabel = true }: ScoreIndicatorProps) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getBgColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excelente';
    if (s >= 60) return 'Bueno';
    return 'Regular';
  };

  const sizeMap = {
    sm: { ring: 'w-10 h-10', text: 'text-xs', stroke: 3 },
    md: { ring: 'w-14 h-14', text: 'text-sm', stroke: 4 },
    lg: { ring: 'w-20 h-20', text: 'text-lg', stroke: 5 },
  };

  const s = sizeMap[size];
  const radius = size === 'sm' ? 16 : size === 'md' ? 22 : 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('relative', s.ring)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22" cy="22" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-muted/30"
          />
          <circle
            cx="22" cy="22" r={radius}
            fill="none"
            strokeWidth={s.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(getBgColor(score), 'transition-all duration-700')}
            style={{ stroke: 'currentColor' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', s.text, getColor(score))}>{score}</span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', getColor(score))}>
          {getLabel(score)}
        </span>
      )}
    </div>
  );
}
