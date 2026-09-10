import { type NextRequest } from 'next/server';

export type UploadQueueV1Query = {
  whereSQL: string;
  filterValues: unknown[];
  paginationValues: unknown[];
  safeLimit: number;
  safeOffset: number;
  limitParamIndex: number;
  offsetParamIndex: number;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = parseInt(value || String(fallback), 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 1) : fallback;
}

function parseNonNegativeInt(value: string | null, fallback: number) {
  const parsed = parseInt(value || String(fallback), 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : fallback;
}

export function parseUploadQueueV1Query(request: NextRequest): UploadQueueV1Query {
  const url = new URL(request.url);
  const whereClauses: string[] = [];
  const filterValues: unknown[] = [];
  let paramIdx = 1;

  const addFilter = (clause: string, value: unknown) => {
    whereClauses.push(clause.replace('?', `$${paramIdx++}`));
    filterValues.push(value);
  };

  const fileName = url.searchParams.get('file_name');
  if (fileName) {
    addFilter('uq.file_name ILIKE ?', `%${fileName}%`);
  }

  const status = url.searchParams.get('status');
  if (status) {
    addFilter('uq.status = ?', status);
  }

  const dateStart = url.searchParams.get('date_start');
  if (dateStart) {
    addFilter('uq.upload_date >= ?', dateStart);
  }

  const dateEnd = url.searchParams.get('date_end');
  if (dateEnd) {
    addFilter('uq.upload_date <= ?', dateEnd);
  }

  const positionId = url.searchParams.get('position_id');
  if (positionId) {
    addFilter('uq.position_id = ?', positionId);
  }

  const sourceId = url.searchParams.get('source_id');
  if (sourceId) {
    addFilter('uq.source_id = ?', sourceId);
  }

  const safeLimit = parsePositiveInt(url.searchParams.get('limit'), 20);
  const safeOffset = parseNonNegativeInt(url.searchParams.get('offset'), 0);
  const limitParamIndex = paramIdx++;
  const offsetParamIndex = paramIdx++;

  return {
    whereSQL: whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '',
    filterValues,
    paginationValues: [...filterValues, safeLimit, safeOffset],
    safeLimit,
    safeOffset,
    limitParamIndex,
    offsetParamIndex,
  };
}
