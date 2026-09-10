import { type NextRequest, NextResponse } from 'next/server';
import { authorizePositionApplicantsRequest, connectPositionApplicantsDb, verifyPositionApplicantsAccess } from './position-applicants-route-access';
import { mapPositionApplicantRow, type PositionApplicantRow } from './position-applicants-route-map';
import { buildPositionApplicantsQueries, parsePositionApplicantsQuery } from './position-applicants-route-query';
import { type PositionApplicantsRouteContext } from './position-applicants-route-types';

type CountRow = {
  total: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

export async function handleGetPositionApplicants(request: NextRequest, { params }: PositionApplicantsRouteContext) {
  const { id: positionId } = await params;

  try {
    const authorization = await authorizePositionApplicantsRequest(positionId);
    if (!authorization.ok) {
      return authorization.response;
    }

    const options = parsePositionApplicantsQuery(request, positionId);
    const client = await connectPositionApplicantsDb();
    if (client instanceof NextResponse) {
      return client;
    }

    try {
      const accessResponse = await verifyPositionApplicantsAccess(client, positionId, authorization.session);
      if (accessResponse) {
        return accessResponse;
      }

      const queries = buildPositionApplicantsQueries(options);
      const [applicantsResult, countResult] = await Promise.all([
        client.query<PositionApplicantRow>(queries.applicantsQuery, queries.queryParams),
        client.query<CountRow>(queries.countQuery, queries.countParams),
      ]);

      const total = parseInt(countResult.rows[0].total, 10);
      const applicants = applicantsResult.rows.map((row) => mapPositionApplicantRow(row, positionId));

      return NextResponse.json({
        data: applicants,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit),
        },
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error('Error fetching position applicants:', error);
    console.error('Position ID:', positionId);
    console.error('Search params:', Object.fromEntries(new URL(request.url).searchParams));
    console.error('Error stack:', getErrorStack(error));

    return NextResponse.json({
      message: 'Error fetching position applicants',
      error: getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? getErrorStack(error) : undefined,
      positionId,
      searchParams: Object.fromEntries(new URL(request.url).searchParams),
    }, { status: 500 });
  }
}
