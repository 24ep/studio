import type {
  BuildUploadQueueQueryInput,
  UploadQueueDateFilterType,
  UploadQueueDatePreset,
} from './applicant-import-queue-util-types';

function appendUploadQueueDateParam(
  params: URLSearchParams,
  dateFilterType: UploadQueueDateFilterType,
  boundary: 'start' | 'end',
  date?: Date,
) {
  if (!date) {
    return;
  }

  const dateParamMap: Record<UploadQueueDateFilterType, Record<'start' | 'end', string>> = {
    create: { start: 'date_start', end: 'date_end' },
    process: { start: 'process_date_start', end: 'process_date_end' },
    complete: { start: 'completed_date_start', end: 'completed_date_end' },
  };

  params.append(dateParamMap[dateFilterType][boundary], date.toISOString());
}

export function buildUploadQueueQueryParams({
  currentPage,
  currentPageSize,
  searchTerm,
  statusFilter = 'all',
  positionFilter = 'all',
  sourceFilter = 'all',
  dateRange,
  dateFilterType,
  sortField,
  sortDirection,
}: BuildUploadQueueQueryInput) {
  const params = new URLSearchParams({
    limit: currentPageSize.toString(),
    offset: ((currentPage - 1) * currentPageSize).toString(),
    ...(searchTerm && { file_name: searchTerm }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(positionFilter !== 'all' && { position_id: positionFilter }),
    ...(sourceFilter !== 'all' && { source_id: sourceFilter }),
    sort_field: sortField,
    sort_direction: sortDirection || '',
  });

  appendUploadQueueDateParam(params, dateFilterType, 'start', dateRange?.from);
  appendUploadQueueDateParam(params, dateFilterType, 'end', dateRange?.to);

  return params;
}

export function createUploadQueueDatePresetRange(preset: UploadQueueDatePreset, now = new Date()) {
  let from: Date;
  let to: Date;

  switch (preset) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'yesterday':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      break;
    case 'last7days':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'last30days':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'thisMonth':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'lastMonth':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
  }

  return { from, to };
}
