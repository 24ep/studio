import type { JsonValue } from './json-types';

// Enhanced pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  offset: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UploadQueueSummary {
  total: number;
  queued: number;
  inprocess: number;
  success: number;
  error: number;
}

export interface UploadQueueJob {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  error?: string | null;
  error_details?: string | null;
  source?: string | null;
  upload_date: string;
  completed_date?: string | null;
  upload_id?: string | null;
  created_by?: string | null;
  updated_at: string;
  file_path: string;
  webhook_payload?: JsonValue;
  position_id?: string | null;
  process_date?: string | null;
  position_title?: string | null;
  url?: string | null;
}

export interface UploadQueueResponse {
  data: UploadQueueJob[];
  total: number;
  summary: UploadQueueSummary;
  pagination: PaginationInfo;
}

export interface UploadQueueCountResponse {
  count: number;
}

export interface UploadQueuePendingCountResponse {
  count: number;
}
