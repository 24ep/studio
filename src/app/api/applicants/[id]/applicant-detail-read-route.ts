import { auth } from '@/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getPool, restoreDefaultStatementTimeout, type DbClient } from '@/lib/db';
import { getSystemSetting } from '@/lib/systemSettings';
import {
  buildApplicantDetailSuccessHeaders,
  fetchApplicantHeadStatus,
  fetchApplicantDetailResponseData,
  isApplicantQueryTimeoutError,
  isAuthorizedForApplicantDetail,
  isValidApplicantId,
  mapApplicantDetailFetchError,
  NO_CACHE_HEADERS,
  parseApplicantLiteParam,
} from './applicant-detail-route-utils';

type ApplicantDetailRouteContext = { params: Promise<{ id: string }> };
type ApplicantDetailErrorLike = { code?: string; message?: string };

function toApplicantDetailErrorLike(error: unknown): ApplicantDetailErrorLike {
  return {
    code: getErrorCode(error),
    message: getErrorMessage(error),
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }

  const code = error.code;
  return typeof code === 'string' ? code : undefined;
}

export async function HEAD(request: NextRequest, { params }: ApplicantDetailRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const { id } = await params;
  if (!isValidApplicantId(id)) {
    console.error('Invalid Applicant ID format:', id);
    return new NextResponse(null, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    const headStatus = await fetchApplicantHeadStatus({ client, applicantId: id });

    if (headStatus.queryTimeMs > 2000) {
      console.warn(`[PERF] Slow validation query: ${headStatus.queryTimeMs}ms for ID: ${id}`);
    }

    if (!headStatus.exists) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...NO_CACHE_HEADERS },
    });
  } catch (error: unknown) {
    console.error('Error validating Applicant', id, error);

    if (isApplicantQueryTimeoutError(toApplicantDetailErrorLike(error))) {
      return new NextResponse(null, { status: 408 });
    }

    return new NextResponse(null, { status: 500 });
  } finally {
    try {
      await restoreDefaultStatementTimeout(client);
    } finally {
      client.release();
    }
  }
}

export async function GET(request: NextRequest, { params }: ApplicantDetailRouteContext) {
  const { id } = await params;
  const session = await auth();

  if (!isValidApplicantId(id)) {
    console.error('Invalid Applicant ID format:', id);
    return NextResponse.json({ message: 'Invalid Applicant ID format' }, { status: 400 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const isAuthorized = await isAuthorizedForApplicantDetail({
    applicantId: id,
    userId: session?.user?.id,
    token,
    connectClient: () => getPool().connect(),
  });

  if (!isAuthorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const lite = parseApplicantLiteParam(url);

  let client: DbClient | null = null;
  try {
    client = await getPool().connect();
  } catch (connectionError: unknown) {
    const errorMessage = getErrorMessage(connectionError);
    console.error(`[Applicants API] Failed to connect to database:`, connectionError);
    return NextResponse.json({
      message: 'Database connection error',
      error: errorMessage,
    }, { status: 500 });
  }

  try {
    await client.query('SET statement_timeout = 25000');

    const detailResult = await fetchApplicantDetailResponseData({
      client,
      applicantId: id,
      userId: session?.user?.id,
      lite,
      readSystemSetting: getSystemSetting,
    });

    if (!detailResult.found) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    const responseData = detailResult.responseData;

    return NextResponse.json(responseData, {
      headers: buildApplicantDetailSuccessHeaders(responseData),
    });
  } catch (error: unknown) {
    console.error('Error fetching Applicant', id, error);
    const errorCode = getErrorCode(error);
    const errorMessage = getErrorMessage(error);

    if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
      console.error('Database connection error for Applicant:', id, error);
    }

    if (errorCode === '57014' || errorMessage.includes('timeout')) {
      console.error('Database timeout error for Applicant:', id, error);
    }

    const errorResponse = mapApplicantDetailFetchError(toApplicantDetailErrorLike(error), id);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  } finally {
    if (client) {
      try {
        await restoreDefaultStatementTimeout(client);
      } finally {
        client.release();
      }
    }
  }
}
