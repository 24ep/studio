"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Eye, Edit, Trash2, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Position } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface PositionsMobileListViewProps {
  positions: Position[];
  headcountData: Record<string, { filled: number; total: number }>;
  isLoadingHeadcount: boolean;
  isJobMatchEnabled: boolean;
  page: number;
  pageSize: number;
  onPositionClick: (positionId: string) => void;
  onEditClick: (positionId: string, event: React.MouseEvent) => void;
  onDeleteClick: (position: Position, event: React.MouseEvent) => void;
}

export function PositionsMobileListView({
  positions,
  headcountData,
  isLoadingHeadcount,
  isJobMatchEnabled,
  page,
  pageSize,
  onPositionClick,
  onEditClick,
  onDeleteClick,
}: PositionsMobileListViewProps) {
  const renderPositionCard = (position: Position, index: number) => {
    const headcount = headcountData[position.id];
    const positionType = position.positionLevel || 'N/A';
    const grade = position.grade ? (typeof position.grade === 'object' ? (position.grade.label || position.grade.name) : position.grade) : 'N/A';

    return (
      <div
        key={position.id}
        className="flex items-center gap-3 px-3 py-4 bg-background active:bg-muted/70 transition-all duration-150 cursor-pointer border-b border-border/50"
        onClick={() => onPositionClick(position.id)}
       role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}>
        {/* Icon on the left */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-3.5 w-3.5 text-primary" />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-xs leading-tight truncate mb-0.5">{position.title}</h3>

          {/* Position Details */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{grade}</span>
            <span>/</span>
            <span className="truncate">{position.department}</span>
            <span>/</span>
            <span className="truncate">{positionType}</span>
          </div>
        </div>

        {/* Headcount Badge - Right side */}
        <div className="flex-shrink-0">
          {isLoadingHeadcount ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : headcount ? (
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0.5 font-medium",
                headcount.filled === 0 && headcount.total === 0
                  ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                  : headcount.filled >= headcount.total
                    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                    : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              )}
            >
              <Users className="h-3 w-3 mr-1" />
              {headcount.filled}/{headcount.total}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        {/* Chevron */}
        <div className="p-1 -m-1 flex-shrink-0">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {positions.map((position, index) => renderPositionCard(position, index))}
    </div>
  );
}
