export type QueueStatus = 'queued' | 'inprocess' | 'success' | 'failed' | 'cancelled' | string;
export type QueueStatusIconType = 'queued' | 'processing' | 'success' | 'failed' | 'unknown';
export type UploadQueueDateFilterType = 'create' | 'process' | 'complete';
export type UploadQueueDatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth';

export interface QueueStatusLike {
  status: QueueStatus;
}

export interface UploadQueueItemLike extends QueueStatusLike {
  id: string;
  file_name?: string;
  file_size?: number;
  upload_date?: string;
  url?: string;
}

export interface UploadQueueDateRangeLike {
  from?: Date;
  to?: Date;
}

export interface UploadQueueStatusIconModel {
  type: QueueStatusIconType;
  className: string;
}

export interface BuildUploadQueueQueryInput {
  currentPage: number;
  currentPageSize: number;
  searchTerm?: string;
  statusFilter?: string;
  positionFilter?: string;
  sourceFilter?: string;
  dateRange?: UploadQueueDateRangeLike;
  dateFilterType: UploadQueueDateFilterType;
  sortField: string;
  sortDirection?: 'asc' | 'desc' | null;
}
