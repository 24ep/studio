import { type NextRequest } from 'next/server';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

export function parseApplicantCommentsPagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    limit: Math.min(parseInt(searchParams.get('limit') || '10', 10), 50),
    offset: parseInt(searchParams.get('offset') || '0', 10),
  };
}

export async function parseApplicantCommentWriteBody(request: NextRequest) {
  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const formData = await request.formData();
    return {
      content: formData.get('content') as string,
      type: (formData.get('type') as string) || 'comment',
      files: Array.from(formData.getAll('attachments')) as File[],
      labels: Array.from(formData.getAll('labels')) as string[],
      commentId: formData.get('commentId') as string,
    };
  }

  const body = await readRequestJsonObject(request);
  return {
    content: getJsonString(body, 'content'),
    type: getJsonString(body, 'type') || 'comment',
    files: [] as File[],
    labels: [] as string[],
    commentId: getJsonString(body, 'commentId'),
  };
}
