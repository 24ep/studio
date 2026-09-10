import { NextResponse } from 'next/server';
import type {
  PositionJobMatchesRequestOptions,
  PositionJobMatchesRouteContext,
} from './position-job-matches-schema';

const POSITION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_SORT_COLUMNS = {
  name: 'c.name',
  email: 'c.email',
  matchScore: 'jm."fitScore"',
  applicationDate: 'c."applicationDate"',
  status: 'c."statusId"',
  lastUpdate: 'c."updatedAt"',
} as const;

export async function resolvePositionJobMatchesPositionId(context: PositionJobMatchesRouteContext) {
  const { id } = await context.params;
  if (!id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Position ID is required' }, { status: 400 }),
    };
  }

  if (!POSITION_ID_PATTERN.test(id)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid position ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, positionId: id };
}

export function parsePositionJobMatchesRequest(url: string): PositionJobMatchesRequestOptions {
  const { searchParams } = new URL(url);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, Number.parseInt(searchParams.get('limit') || '20', 10)));

  return {
    searchParams,
    pagination: {
      page,
      limit,
      offset: (page - 1) * limit,
    },
    filters: {
      hasJobMatch: searchParams.get('hasJobMatch') === 'true',
      notApplied: searchParams.get('notApplied') === 'true',
      searchTerm: searchParams.get('searchTerm') || '',
      showPinSection: searchParams.get('showPinSection') === 'true',
    },
    sort: {
      sortClause: buildPositionJobMatchesSortClause(searchParams),
    },
  };
}

function buildPositionJobMatchesSortClause(searchParams: URLSearchParams) {
  const sortColumnParam = searchParams.get('sortColumn') || 'matchScore';
  const sortDirectionParam = (searchParams.get('sortDirection') || 'desc').toLowerCase();
  const sortColumn = ALLOWED_SORT_COLUMNS[sortColumnParam as keyof typeof ALLOWED_SORT_COLUMNS] || 'jm."fitScore"';
  const sortDirection = sortDirectionParam === 'asc' ? 'ASC' : 'DESC';

  let sortClause = `${sortColumn} ${sortDirection}`;
  if (sortColumnParam === 'matchScore') {
    sortClause = `jm."fitScore" ${sortDirection} ${sortDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST'}`;
  }

  return searchParams.get('showPinSection') === 'true'
    ? `c."isPinned" DESC, c."pinnedAt" DESC NULLS LAST, ${sortClause}`
    : sortClause;
}
