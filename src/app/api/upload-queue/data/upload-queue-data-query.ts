import type { NextRequest } from 'next/server';

export type UploadQueueQueryValue = string | number | string[] | null;

export interface UploadQueueDataFilters {
  fileName?: string;
  statusCodes: string[];
  dateStart?: string;
  dateEnd?: string;
  positionId?: string;
  safeLimit: number;
  safeOffset: number;
}

export interface UploadQueueSummary {
  total: number;
  queued: number;
  inprocess: number;
  success: number;
  error: number;
}

export function parseUploadQueueDataFilters(request: NextRequest): UploadQueueDataFilters {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || url.searchParams.get('pageSize') || '20', 10);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const offset = parseInt(url.searchParams.get('offset') || String((page - 1) * limit), 10);
  const status = url.searchParams.get('status') || undefined;

  return {
    fileName: url.searchParams.get('file_name') || url.searchParams.get('filter') || undefined,
    statusCodes: status ? status.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 10) : [],
    dateStart: url.searchParams.get('date_start') || url.searchParams.get('dateRangeStart') || undefined,
    dateEnd: url.searchParams.get('date_end') || url.searchParams.get('dateRangeEnd') || undefined,
    positionId: url.searchParams.get('position_id') || url.searchParams.get('positionId') || undefined,
    safeLimit: Math.max(limit, 1),
    safeOffset: Math.max(offset, 0),
  };
}

export function buildUploadQueueDataQueryParts(filters: UploadQueueDataFilters) {
  const filterValues: UploadQueueQueryValue[] = [
    filters.fileName ? `%${filters.fileName}%` : null,
    filters.statusCodes[0] ?? null,
    filters.dateStart || null,
    filters.dateEnd || null,
    filters.positionId || null,
    filters.statusCodes.length > 1 ? filters.statusCodes : null,
  ];

  const whereClause = `WHERE 
        ($1 IS NULL OR uq.file_name ILIKE $1)
        AND ($2 IS NULL OR uq.status = $2 OR ($6::text[] IS NOT NULL AND uq.status = ANY($6::text[])))
        AND ($3 IS NULL OR uq.upload_date >= $3)
        AND ($4 IS NULL OR uq.upload_date <= $4)
        AND ($5 IS NULL OR uq.position_id = $5)`;

  return {
    countValues: filterValues,
    limitIdx: 7,
    offsetIdx: 8,
    queryValues: [...filterValues, filters.safeLimit, filters.safeOffset],
    whereClause,
  };
}

export function normalizeUploadQueueSummary(row: Record<string, unknown> | undefined): UploadQueueSummary {
  return {
    total: Number(row?.total) || 0,
    queued: Number(row?.queued) || 0,
    inprocess: Number(row?.inprocess) || 0,
    success: Number(row?.success) || 0,
    error: Number(row?.error) || 0,
  };
}

export function buildUploadQueuePagination(filters: UploadQueueDataFilters, total: number) {
  return {
    page: Math.floor(filters.safeOffset / filters.safeLimit) + 1,
    limit: filters.safeLimit,
    offset: filters.safeOffset,
    totalPages: Math.ceil(total / filters.safeLimit),
    hasNextPage: filters.safeOffset + filters.safeLimit < total,
    hasPrevPage: filters.safeOffset > 0,
  };
}
