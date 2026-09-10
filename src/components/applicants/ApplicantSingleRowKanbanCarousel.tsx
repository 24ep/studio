"use client";

import {
  ChevronLeftIcon as ChevronRight,
  ChevronRightIcon as ChevronLeft,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SingleRowKanbanHeader({
  currentIndex,
  onNext,
  onPrevious,
  totalCount,
}: {
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  totalCount: number;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">My Tasks</h2>
        <Badge variant="secondary" className="text-sm">
          {currentIndex + 1} of {totalCount}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <SingleRowKanbanNavButton
          ariaLabel="Previous applicant"
          disabled={totalCount <= 1}
          onClick={onPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </SingleRowKanbanNavButton>
        <SingleRowKanbanNavButton
          ariaLabel="Next applicant"
          disabled={totalCount <= 1}
          onClick={onNext}
        >
          <ChevronRight className="w-4 h-4" />
        </SingleRowKanbanNavButton>
      </div>
    </div>
  );
}

export function SingleRowKanbanPaginationDots({
  currentIndex,
  onSelect,
  totalCount,
}: {
  currentIndex: number;
  onSelect: (index: number) => void;
  totalCount: number;
}) {
  return (
    <div className="flex items-center justify-center mt-6">
      <div className="flex gap-2">
        {Array.from({ length: totalCount }, (_, index) => (
          <button
            type="button"
            key={index}
            onClick={() => onSelect(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-200',
              index === currentIndex ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>
    </div>
  );
}

function SingleRowKanbanNavButton({
  ariaLabel,
  children,
  disabled,
  onClick,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {children}
    </Button>
  );
}
