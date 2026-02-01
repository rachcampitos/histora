'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, LucideIcon, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs periodo anterior',
  icon: Icon,
  trend,
  prefix,
  suffix,
  className,
  loading,
}: MetricCardProps) {
  // Determine trend from change if not provided
  const effectiveTrend = trend ?? (change ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral');

  const TrendIcon = effectiveTrend === 'up' ? ArrowUp : effectiveTrend === 'down' ? ArrowDown : Minus;

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  if (loading) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {typeof value === 'number' ? value.toLocaleString('es-PE') : value}
          {suffix}
        </div>
        {change !== undefined && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <TrendIcon className={cn('h-3 w-3', trendColors[effectiveTrend])} />
            <span className={trendColors[effectiveTrend]}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
