"use client";

import { LayoutGrid, List } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ApplicantsRecruitmentView = 'applicants' | 'task-board';

interface ApplicantsRecruitmentViewSwitchProps {
  activeView: ApplicantsRecruitmentView;
  onViewChange: (view: ApplicantsRecruitmentView) => void;
  className?: string;
}

export function ApplicantsRecruitmentViewSwitch({
  activeView,
  onViewChange,
  className,
}: ApplicantsRecruitmentViewSwitchProps) {
  return (
    <div className={cn("flex items-center gap-1 rounded-full bg-muted p-1", className)}>
      <button
        type="button"
        className={getViewButtonClassName(activeView === 'applicants')}
        onClick={() => onViewChange('applicants')}
        aria-pressed={activeView === 'applicants'}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
      <button
        type="button"
        className={getViewButtonClassName(activeView === 'task-board')}
        onClick={() => onViewChange('task-board')}
        aria-pressed={activeView === 'task-board'}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </button>
    </div>
  );
}

function getViewButtonClassName(active: boolean) {
  return cn(
    "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground",
  );
}
