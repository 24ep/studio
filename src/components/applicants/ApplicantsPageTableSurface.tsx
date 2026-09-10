"use client";

import React from 'react';

import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh-indicator';
import { cn } from '@/lib/utils';
import { ApplicantsPageTableSurfaceContent } from './ApplicantsPageTableSurfaceContent';
import type { ApplicantsPageTableSurfaceProps } from './ApplicantsPageTableSurfaceTypes';

export function ApplicantsPageTableSurface(props: ApplicantsPageTableSurfaceProps) {
  const {
  isMobile,
  pullProgress,
  isRefreshing,
  pullToRefreshRef,
  } = props;

  return (
    <div className="flex-1 overflow-hidden relative flex flex-col">
      {isMobile && (
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <PullToRefreshIndicator pullProgress={pullProgress} isRefreshing={isRefreshing} />
        </div>
      )}
      <div
        ref={pullToRefreshRef}
        className={cn(
          "flex-1 overflow-auto",
          !isMobile && "pb-4 pt-3",
        )}
      >
        <div className="h-full">
          <ApplicantsPageTableSurfaceContent {...props} />
        </div>
      </div>
    </div>
  );
}

export type { ApplicantsPageTableSurfaceProps } from './ApplicantsPageTableSurfaceTypes';
