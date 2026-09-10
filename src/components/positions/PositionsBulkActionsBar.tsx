import { Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PositionsBulkActionsBarProps {
  selectedCount: number;
  onUpdateMatchCriteria: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function PositionsBulkActionsBar({
  selectedCount,
  onUpdateMatchCriteria,
  onDelete,
  onClear,
}: PositionsBulkActionsBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-2 dark:border-indigo-900 dark:bg-indigo-950/40">
      <span className="mr-1 text-sm font-semibold text-indigo-900 dark:text-indigo-200">{selectedCount} selected</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUpdateMatchCriteria}
        className="h-8 px-2 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900"
      >
        <Edit className="h-3 w-3 mr-1" /> Update Match Criteria
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3 w-3 mr-1" /> Delete
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="ml-auto h-8 px-2 text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Clear
      </Button>
    </div>
  );
}
