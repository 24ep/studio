import type { QueryResultRow } from 'pg';
import type { DbClient } from '@/lib/db';

export type UploadQueueBulkAction = 'retry' | 'cancel' | 'delete' | 'process';

export type UploadQueueBulkActionBody = {
  action?: unknown;
  itemIds?: unknown;
};

export type UploadQueueBulkActionInput = {
  action: UploadQueueBulkAction;
  itemIds: string[];
};

export type UploadQueueBulkItemResult = {
  success: boolean;
  reason?: string;
};

export type UploadQueueBulkFailedDetail = {
  itemId: string;
  reason: string;
};

export type UploadQueueBulkActionClient = DbClient;

export type UploadQueueBulkJob = QueryResultRow & {
  id: string;
  status: string;
  file_path: string | null;
  webhook_payload?: {
    retry_count?: number;
    [key: string]: unknown;
  } | null;
};

export type UploadQueueIdRow = QueryResultRow & {
  id: string;
};
