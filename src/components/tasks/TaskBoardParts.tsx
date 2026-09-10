"use client";

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface TaskBoardEmptyStateProps {
  hasStages: boolean;
}

export function TaskBoardEmptyState({ hasStages }: TaskBoardEmptyStateProps) {
  if (hasStages) return null;

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
          <Plus className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">No stages configured</p>
        <p className="text-sm text-muted-foreground">Please configure stages to display tasks</p>
      </div>
    </div>
  );
}

interface TaskBoardScrollButtonProps {
  direction: 'left' | 'right';
  visible: boolean;
  onClick: () => void;
}

export function TaskBoardScrollButton({
  direction,
  visible,
  onClick,
}: TaskBoardScrollButtonProps) {
  if (!visible) return null;

  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  const positionClassName = direction === 'left' ? 'left-74' : 'right-8';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Scroll ${direction}`}
      className={`fixed ${positionClassName} top-1/2 transform -translate-y-1/2 z-50 w-12 h-12 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 backdrop-blur-sm`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
