"use client";

import { TableBody } from '@/components/ui/table';
import {
  ApplicantImportQueueEmptyTableBody,
  ApplicantImportQueueTableRow,
} from './ApplicantImportQueueTableBodyParts';
import type { ApplicantImportQueueTableBodyProps } from './ApplicantImportQueueTableBodyTypes';

export function ApplicantImportQueueTableBody({
  items,
  selectedItems,
  onSelectItem,
  onPreviewFile,
  onShowDetails,
  onRetryItem,
  onDeleteItem,
}: ApplicantImportQueueTableBodyProps) {
  if (!items || items.length === 0) {
    return <ApplicantImportQueueEmptyTableBody />;
  }

  return (
    <TableBody>
      {items.map((item) => (
        <ApplicantImportQueueTableRow
          key={item.id}
          item={item}
          isSelected={selectedItems.has(item.id)}
          onDeleteItem={onDeleteItem}
          onPreviewFile={onPreviewFile}
          onRetryItem={onRetryItem}
          onSelectItem={onSelectItem}
          onShowDetails={onShowDetails}
        />
      ))}
    </TableBody>
  );
}
