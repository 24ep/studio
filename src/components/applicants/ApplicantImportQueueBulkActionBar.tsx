"use client";

import { Button } from '@/components/ui/button';
import { ArrowUturnLeftIcon as RotateCcw, TrashIcon as Trash2 } from '@heroicons/react/24/outline';
import type { QueueItem } from './applicant-import-queue-types';

interface ApplicantImportQueueBulkActionBarProps {
  items?: QueueItem[];
  selectedItems: Set<string>;
  onRetry: (itemIds: string[]) => void;
  onDelete: (itemIds: string[]) => void;
  onClear: () => void;
}

export function ApplicantImportQueueBulkActionBar({
  items,
  selectedItems,
  onRetry,
  onDelete,
  onClear,
}: ApplicantImportQueueBulkActionBarProps) {
  const selectedItemIds = Array.from(selectedItems);
  const hasRetryableItems = items?.some(item =>
    selectedItems.has(item.id) && ['failed', 'success'].includes(item.status)
  );

  if (selectedItems.size === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/30 border-b border-border">
      <span className="text-sm text-muted-foreground">{selectedItems.size} selected</span>
      {hasRetryableItems && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRetry(selectedItemIds)}
          className="h-7 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          <RotateCcw className="h-3 w-3 mr-1" /> Retry
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(selectedItemIds)}
        className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3 w-3 mr-1" /> Delete
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
      >
        Clear
      </Button>
    </div>
  );
}
