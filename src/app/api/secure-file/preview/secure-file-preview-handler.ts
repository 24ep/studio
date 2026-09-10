import { NextResponse, type NextRequest } from 'next/server';
import {
  requireSecureFilePreviewSession,
  validateSecureFilePreviewContext,
} from './secure-file-preview-auth';
import { handleSecureFilePreviewStreamError } from './secure-file-preview-error';
import { parseSecureFilePreviewRequest } from './secure-file-preview-request';
import { streamSecureFilePreview } from './secure-file-preview-stream';

export async function handleSecureFilePreviewGet(request: NextRequest) {
  const previewRequest = parseSecureFilePreviewRequest(request);

  if (!previewRequest.filePath) {
    return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
  }

  const sessionResult = await requireSecureFilePreviewSession(
    request,
    previewRequest.filePath,
    previewRequest.applicantId
  );
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const contextError = await validateSecureFilePreviewContext({
    session: sessionResult.session,
    filePath: previewRequest.filePath,
    applicantId: previewRequest.applicantId,
    headcountId: previewRequest.headcountId,
  });
  if (contextError) {
    return contextError;
  }

  const streamContext = {
    ...previewRequest,
    requestedBy: sessionResult.session.user.id,
  };

  try {
    return await streamSecureFilePreview(request, streamContext);
  } catch (err) {
    return await handleSecureFilePreviewStreamError(request, streamContext, err);
  }
}
