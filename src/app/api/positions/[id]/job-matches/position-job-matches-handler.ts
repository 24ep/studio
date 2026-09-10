import { NextResponse, type NextRequest } from 'next/server';
import { requirePositionJobMatchesSession } from './position-job-matches-auth';
import {
  connectPositionJobMatchesClient,
  fetchPositionJobMatches,
} from './position-job-matches-data';
import { disabledJobMatchesResponse } from './position-job-matches-feature';
import {
  parsePositionJobMatchesRequest,
  resolvePositionJobMatchesPositionId,
} from './position-job-matches-request';
import {
  positionJobMatchesErrorResponse,
  positionJobMatchesSuccessResponse,
  serializePositionJobMatchApplicants,
} from './position-job-matches-response';
import type { PositionJobMatchesRouteContext } from './position-job-matches-schema';

export async function handleGetPositionJobMatches(request: NextRequest, context: PositionJobMatchesRouteContext) {
  try {
    const sessionResult = await requirePositionJobMatchesSession();
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const disabledResponse = await disabledJobMatchesResponse();
    if (disabledResponse) {
      return disabledResponse;
    }

    const positionIdResult = await resolvePositionJobMatchesPositionId(context);
    if (!positionIdResult.ok) {
      return positionIdResult.response;
    }

    const options = parsePositionJobMatchesRequest(request.url);
    const connection = await connectPositionJobMatchesClient();
    if (!connection.ok) {
      return NextResponse.json(connection.responseBody, { status: 500 });
    }

    const { client } = connection;
    try {
      const result = await fetchPositionJobMatches(client, {
        positionId: positionIdResult.positionId,
        pagination: options.pagination,
        filters: options.filters,
        sort: options.sort,
      });

      if (!result.ok) {
        return NextResponse.json({ error: 'Position not found' }, { status: 404 });
      }

      return positionJobMatchesSuccessResponse({
        applicants: serializePositionJobMatchApplicants(result.rows),
        pagination: options.pagination,
        total: result.total,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return positionJobMatchesErrorResponse(request, error);
  }
}
