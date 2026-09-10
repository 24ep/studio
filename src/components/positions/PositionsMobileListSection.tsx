"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh-indicator';
import type { Position } from '@/lib/types';

import { PositionsMobileListView } from './PositionsMobileListView';

interface PositionsMobileListSectionProps {
  positions: Position[];
  visibleCount: number;
  onVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  pullToRefreshRef: React.RefObject<HTMLDivElement>;
  pullProgress: number;
  isRefreshing: boolean;
  headcountData: Record<string, { total: number; vacant: number; filled: number }>;
  isLoadingHeadcount: boolean;
  isJobMatchEnabled: boolean;
  page: number;
  pageSize: number;
  onPositionClick: (positionId: string) => void;
  onEditClick: (positionId: string, event: React.MouseEvent) => void;
  onDeleteClick: (position: Position, event: React.MouseEvent) => void;
}

export function PositionsMobileListSection({
  positions,
  visibleCount,
  onVisibleCountChange,
  pullToRefreshRef,
  pullProgress,
  isRefreshing,
  headcountData,
  isLoadingHeadcount,
  isJobMatchEnabled,
  page,
  pageSize,
  onPositionClick,
  onEditClick,
  onDeleteClick,
}: PositionsMobileListSectionProps) {
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;

    if (scrollPercentage > 0.8 && visibleCount < positions.length) {
      onVisibleCountChange(prev => Math.min(prev + 20, positions.length));
    }
  };

  return (
    <div className="flex-1 overflow-hidden relative flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <PullToRefreshIndicator
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />
      </div>
      <div
        ref={pullToRefreshRef}
        className="flex-1 overflow-auto pb-24"
        onScroll={handleScroll}
      >
        <PositionsMobileListView
          positions={positions.slice(0, visibleCount)}
          headcountData={headcountData}
          isLoadingHeadcount={isLoadingHeadcount}
          isJobMatchEnabled={isJobMatchEnabled}
          page={page}
          pageSize={pageSize}
          onPositionClick={onPositionClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
        {visibleCount < positions.length && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
