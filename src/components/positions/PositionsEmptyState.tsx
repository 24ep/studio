"use client";

import { Briefcase, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PositionsEmptyStateProps {
  message: string;
  showAddFirstPositionButton: boolean;
  onAddPosition: () => void;
}

export function PositionsEmptyState({
  message,
  showAddFirstPositionButton,
  onAddPosition,
}: PositionsEmptyStateProps) {
  return (
    <div className="empty-state flex flex-1 flex-col items-center justify-center px-4 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
        <Briefcase className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-zinc-50">No positions found</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-zinc-400">{message}</p>
      {showAddFirstPositionButton && (
        <Button onClick={onAddPosition} className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Position
        </Button>
      )}
    </div>
  );
}
