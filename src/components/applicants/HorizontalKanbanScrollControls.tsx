"use client";

import {
  ChevronLeftIcon as ChevronRight,
  ChevronRightIcon as ChevronLeft,
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HorizontalKanbanScrollHeader({
  columnCount,
  applicantCount,
  scrollPosition,
  onScrollLeft,
  onScrollRight,
}: {
  columnCount: number;
  applicantCount: number;
  scrollPosition: number;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <HorizontalKanbanScrollButton
        direction="left"
        disabled={scrollPosition <= 0}
        onClick={onScrollLeft}
      />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{columnCount} columns</span>
        <Badge variant="secondary" className="text-xs">
          {applicantCount} applicants
        </Badge>
      </div>
      <HorizontalKanbanScrollButton direction="right" onClick={onScrollRight} />
    </div>
  );
}

export function HorizontalKanbanFloatingScrollButtons({
  showScrollButtons,
  scrollPosition,
  onScrollLeft,
  onScrollRight,
}: {
  showScrollButtons: boolean;
  scrollPosition: number;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}) {
  if (!showScrollButtons) {
    return null;
  }

  return (
    <>
      {scrollPosition > 0 && (
        <HorizontalKanbanScrollButton
          direction="left"
          floatingPosition="left"
          onClick={onScrollLeft}
        />
      )}
      <HorizontalKanbanScrollButton
        direction="right"
        floatingPosition="right"
        onClick={onScrollRight}
      />
    </>
  );
}

function HorizontalKanbanScrollButton({
  direction,
  disabled,
  floatingPosition,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled?: boolean;
  floatingPosition?: 'left' | 'right';
  onClick: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Scroll columns ${direction}`}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200",
        floatingPosition === 'left' && "absolute left-2 top-1/2 transform -translate-y-1/2 z-10",
        floatingPosition === 'right' && "absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
