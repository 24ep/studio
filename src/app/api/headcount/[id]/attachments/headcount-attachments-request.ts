import { NextResponse, type NextRequest } from 'next/server';
import type { HeadcountAttachmentsRouteContext } from './headcount-attachments-types';

const MAX_HEADCOUNT_ATTACHMENT_SIZE = 500 * 1024 * 1024;

export async function resolveHeadcountAttachmentParams(context: HeadcountAttachmentsRouteContext) {
  const { id } = await context.params;
  return { headcountId: id };
}

export async function parseHeadcountAttachmentUpload(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const label = (formData.get('label') as string) || 'attachment';

  if (!file) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'No file uploaded' }, { status: 400 }),
    };
  }

  if (file.size > MAX_HEADCOUNT_ATTACHMENT_SIZE) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_HEADCOUNT_ATTACHMENT_SIZE / (1024 * 1024)}MB` },
        { status: 400 },
      ),
    };
  }

  return {
    ok: true as const,
    file,
    label,
  };
}

export function parseHeadcountAttachmentDeleteQuery(request: NextRequest) {
  const attachmentId = request.nextUrl.searchParams.get('attachmentId');

  if (!attachmentId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 }),
    };
  }

  return { ok: true as const, attachmentId };
}
