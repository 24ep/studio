import { NextResponse, type NextRequest } from 'next/server';
import { getAllowedOrigin } from '@/lib/cors';
import { requireUploadQueueV1User } from './upload-queue-v1-auth';
import { fetchUploadQueueV1 } from './upload-queue-v1-data';
import { parseUploadQueueV1Query } from './upload-queue-v1-query';

export async function handleGetUploadQueueV1(request: NextRequest) {
  try {
    const authorization = await requireUploadQueueV1User(request);
    if (!authorization.ok) {
      return authorization.response;
    }

    const query = parseUploadQueueV1Query(request);
    const result = await fetchUploadQueueV1(query);

    return NextResponse.json({
      data: result.data,
      total: result.total,
      summary: result.summary,
      pagination: {
        page: Math.floor(query.safeOffset / query.safeLimit) + 1,
        limit: query.safeLimit,
        offset: query.safeOffset,
        totalPages: Math.ceil(result.total / query.safeLimit),
        hasNextPage: query.safeOffset + query.safeLimit < result.total,
        hasPrevPage: query.safeOffset > 0,
      },
    });
  } catch (error) {
    console.error('V1 Upload queue error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message,
    }, { status: 500 });
  }
}

export function handleUploadQueueV1Options(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new Response(null, { status: 200, headers });
}
