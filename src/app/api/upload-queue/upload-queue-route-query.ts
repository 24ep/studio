import { type NextRequest, NextResponse } from 'next/server';
import { buildServerFileUrl } from '@/lib/fileUrls';

interface UploadQueueQuery {
  whereSQL: string;
  filterValues: unknown[];
  safeLimit: number;
  safeOffset: number;
  sortDirection: 'ASC' | 'DESC';
  safeSortExpr: string;
  limitParamIndex: number;
  offsetParamIndex: number;
}

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  id: 'uq.id',
  upload_date: 'uq.upload_date',
  file_name: 'uq.file_name',
  status: 'uq.status',
  file_size: 'uq.file_size',
  process_date: 'uq.process_date',
  completed_date: 'uq.completed_date',
  position_title: 'p.title',
  source_name: 'cs.name',
  duration: "COALESCE(EXTRACT(EPOCH FROM (uq.completed_date - uq.process_date)), 0)",
};

type UploadQueueFileRow = {
  file_path?: string | null;
  [key: string]: unknown;
};

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }

  const code = error.code;
  return typeof code === 'string' ? code : undefined;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getSortDirection(sortDirectionParam: string | null): 'ASC' | 'DESC' {
  if (sortDirectionParam === 'asc') {
    return 'ASC';
  }

  return 'DESC';
}

function addOptionalFilter(
  clauses: string[],
  values: unknown[],
  columnExpression: string,
  value: string | null,
  transform: (input: string) => unknown = (input) => input
) {
  if (!value) {
    return;
  }

  clauses.push(`${columnExpression} $${values.length + 1}`);
  values.push(transform(value));
}

export function buildUploadQueueQuery(request: NextRequest): UploadQueueQuery {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const sortField = url.searchParams.get('sort_field') || 'upload_date';

  const whereClauses: string[] = [];
  const filterValues: unknown[] = [];

  addOptionalFilter(whereClauses, filterValues, 'file_name ILIKE', url.searchParams.get('file_name'), (fileName) => `%${fileName}%`);
  addOptionalFilter(whereClauses, filterValues, 'status =', url.searchParams.get('status'));
  addOptionalFilter(whereClauses, filterValues, 'upload_date >=', url.searchParams.get('date_start'));
  addOptionalFilter(whereClauses, filterValues, 'upload_date <=', url.searchParams.get('date_end'));
  addOptionalFilter(whereClauses, filterValues, 'process_date >=', url.searchParams.get('process_date_start'));
  addOptionalFilter(whereClauses, filterValues, 'process_date <=', url.searchParams.get('process_date_end'));
  addOptionalFilter(whereClauses, filterValues, 'completed_date >=', url.searchParams.get('completed_date_start'));
  addOptionalFilter(whereClauses, filterValues, 'completed_date <=', url.searchParams.get('completed_date_end'));
  addOptionalFilter(whereClauses, filterValues, 'position_id =', url.searchParams.get('position_id'));
  addOptionalFilter(whereClauses, filterValues, 'source_id =', url.searchParams.get('source_id'));

  return {
    whereSQL: whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '',
    filterValues,
    safeLimit: Math.max(limit, 1),
    safeOffset: Math.max(offset, 0),
    sortDirection: getSortDirection(url.searchParams.get('sort_direction')),
    safeSortExpr: ALLOWED_SORT_FIELDS[sortField] || 'uq.upload_date',
    limitParamIndex: filterValues.length + 1,
    offsetParamIndex: filterValues.length + 2,
  };
}

export function createUploadQueueReadErrorResponse(error: unknown) {
  console.error('Upload queue API error:', error);

  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorCode = getErrorCode(error);
  const errorMessage = getErrorMessage(error);

  if (errorCode === '57014') {
    return NextResponse.json({
      error: 'Request timeout - the query took too long to complete. Please try with a smaller limit or different filters.',
      ...(isDevelopment && {
        details: 'Database query timeout - the upload queue query exceeded the 60-second timeout limit. This may be due to a large number of records or missing database indexes.',
        suggestion: 'Try reducing the page size, adding more specific filters, or contact an administrator to optimize the database.',
      }),
    }, { status: 504 });
  }

  if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
    return NextResponse.json({
      error: 'Database connection failed',
      ...(isDevelopment && {
        details: 'Unable to connect to the database. Please check if the database is running and accessible.',
        suggestion: 'Contact an administrator to check database connectivity.',
      }),
    }, { status: 503 });
  }

  if (errorCode?.startsWith('5')) {
    return NextResponse.json({
      error: 'Database error occurred',
      ...(isDevelopment && {
        details: `Database error: ${errorMessage || 'Unknown database error'}`,
        suggestion: 'Please try again later or contact an administrator if the problem persists.',
      }),
    }, { status: 500 });
  }

  throw error;
}

export async function attachUploadQueueFileUrls<T extends UploadQueueFileRow>(rows: T[]) {
  return Promise.all(
    rows.map(async (job) => ({
      ...job,
      url: job.file_path ? await buildServerFileUrl(job.file_path, { strategy: 'stream' }) : null,
    }))
  );
}
