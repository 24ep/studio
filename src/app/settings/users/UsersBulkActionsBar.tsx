import { Loader2, UserCheck, UserX } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface UsersBulkActionsBarProps {
  selectedCount: number;
  isUpdating: boolean;
  canUpdate: boolean;
  onUpdateStatus: (isActive: boolean) => void;
  onClear: () => void;
}

export function UsersBulkActionsBar({
  selectedCount,
  isUpdating,
  canUpdate,
  onUpdateStatus,
  onClear,
}: UsersBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-2 dark:border-indigo-900 dark:bg-indigo-950/40">
      <span className="mr-1 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
        {selectedCount} selected
      </span>
      <span className="text-sm text-muted-foreground">Update status:</span>
      <Button variant="ghost" size="sm" disabled={isUpdating || !canUpdate} onClick={() => onUpdateStatus(true)}>
        {isUpdating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <UserCheck className="mr-1 h-3 w-3" />}
        Activate
      </Button>
      <Button variant="ghost" size="sm" disabled={isUpdating || !canUpdate} onClick={() => onUpdateStatus(false)}>
        <UserX className="mr-1 h-3 w-3" />
        Deactivate
      </Button>
      <Button variant="ghost" size="sm" disabled={isUpdating} onClick={onClear} className="ml-auto">
        Clear
      </Button>
    </div>
  );
}
