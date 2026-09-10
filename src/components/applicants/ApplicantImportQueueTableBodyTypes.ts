import type { QueueItem } from './applicant-import-queue-types';

export interface ApplicantImportQueueTableBodyProps {
  items?: QueueItem[];
  selectedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
  onPreviewFile: (item: QueueItem) => void;
  onShowDetails: (item: QueueItem) => void;
  onRetryItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export type ApplicantImportQueueRowActions = Pick<
  ApplicantImportQueueTableBodyProps,
  'onDeleteItem' | 'onPreviewFile' | 'onRetryItem' | 'onSelectItem' | 'onShowDetails'
>;
