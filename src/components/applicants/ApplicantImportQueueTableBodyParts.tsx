"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  InformationCircleIcon as Info,
} from '@heroicons/react/24/outline';

import { cn } from '@/lib/utils';
import {
  calculateUploadQueueDuration,
  formatUploadQueueDate,
  formatUploadQueueFileSize,
} from './applicant-import-queue-utils';
import type { QueueItem } from './applicant-import-queue-types';
import { ApplicantImportQueueRowActionMenu } from './ApplicantImportQueueRowActionMenu';
import type { ApplicantImportQueueRowActions } from './ApplicantImportQueueTableBodyTypes';
import {
  ApplicantImportQueueSourceCell,
  ApplicantImportQueueStatusBadge,
} from './ApplicantImportQueueTableRowCells';

interface ApplicantImportQueueTableRowProps extends ApplicantImportQueueRowActions {
  item: QueueItem;
  isSelected: boolean;
}

export function ApplicantImportQueueEmptyTableBody() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={12} className="px-4 py-14 text-center">
          <div className="flex flex-col items-center gap-2">
            <Info className="h-8 w-8 text-muted-foreground" />
            <p className="font-bold text-foreground">No queue items found</p>
            <p className="text-sm text-muted-foreground">Upload CVs or adjust the filters to see queued files.</p>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

export function ApplicantImportQueueTableRow({
  item,
  isSelected,
  onDeleteItem,
  onPreviewFile,
  onRetryItem,
  onSelectItem,
  onShowDetails,
}: ApplicantImportQueueTableRowProps) {
  return (
    <TableRow
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/40",
        isSelected && "bg-primary/5",
      )}
    >
      <TableCell className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectItem(item.id)}
        />
      </TableCell>
      <TableCell className="px-4 py-3 text-xs font-semibold text-muted-foreground">{item.id.slice(0, 8)}...</TableCell>
      <TableCell className="max-w-64 truncate px-4 py-3 font-bold text-foreground" title={item.file_name}>{item.file_name}</TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">{item.position_title || '-'}</TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">
        <ApplicantImportQueueSourceCell item={item} />
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">{formatUploadQueueFileSize(item.file_size)}</TableCell>
      <TableCell className="px-4 py-3">
        <ApplicantImportQueueStatusBadge status={item.status} />
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">{formatUploadQueueDate(item.upload_date)}</TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">{item.process_date ? formatUploadQueueDate(item.process_date) : '-'}</TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">{item.completed_date ? formatUploadQueueDate(item.completed_date) : '-'}</TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">{calculateUploadQueueDuration(item.process_date, item.completed_date)}</TableCell>
      <TableCell className="px-4 py-3 text-right">
        <ApplicantImportQueueRowActionMenu
          item={item}
          onDeleteItem={onDeleteItem}
          onPreviewFile={onPreviewFile}
          onRetryItem={onRetryItem}
          onShowDetails={onShowDetails}
        />
      </TableCell>
    </TableRow>
  );
}
