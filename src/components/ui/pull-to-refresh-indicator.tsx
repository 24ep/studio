"use client";

import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullProgress: number;
  isRefreshing: boolean;
  className?: string;
}

export function PullToRefreshIndicator({
  pullProgress,
  isRefreshing,
  className,
}: PullToRefreshIndicatorProps) {
  if (pullProgress === 0 && !isRefreshing) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-2 transition-all duration-200",
        className
      )}
      style={{
        opacity: Math.max(pullProgress, isRefreshing ? 1 : 0),
        transform: `translateY(${isRefreshing ? 0 : -20 * (1 - pullProgress)}px)`,
      }}
    >
      {isRefreshing ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-primary mb-1" />
          <span className="text-xs text-muted-foreground">Refreshing...</span>
        </>
      ) : (
        <>
          <ArrowDown
            className="h-5 w-5 text-primary mb-1 transition-transform duration-200"
            style={{
              transform: `rotate(${pullProgress >= 1 ? 180 : 0}deg)`,
            }}
          />
          <span className="text-xs text-muted-foreground">
            {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </>
      )}
    </div>
  );
}

