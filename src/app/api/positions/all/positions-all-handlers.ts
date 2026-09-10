import { NextResponse, type NextRequest } from 'next/server';
import { requirePositionsAllSession } from './positions-all-auth';
import { fetchAllPositions } from './positions-all-data';
import { buildPositionsAllQuery, parsePositionsAllFilters } from './positions-all-query';

export async function handleGetAllPositions(request: NextRequest) {
  try {
    const auth = await requirePositionsAllSession();
    if (!auth.ok) {
      return auth.response;
    }

    const filters = parsePositionsAllFilters(new URL(request.url).searchParams);
    const query = await buildPositionsAllQuery(filters, auth.user);
    const positions = await fetchAllPositions(query);

    return NextResponse.json({
      data: positions,
      meta: {
        count: positions.length,
        cached: false,
      },
    }, { status: 200, headers: getPositionsAllResponseHeaders() });
  } catch (error) {
    console.error('Error in GET /api/positions/all:', error);

    return NextResponse.json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function getPositionsAllResponseHeaders() {
  return new Headers({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
}
