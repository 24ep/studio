import { NextResponse, type NextRequest } from 'next/server';
import {
  requireSecureFileStreamSession,
  validateSecureFileStreamContext,
} from './secure-file-stream-auth';
import { handleSecureFileStreamError } from './secure-file-stream-error';
import { parseSecureFileStreamRequest } from './secure-file-stream-request';
import { streamSecureFileObject } from './secure-file-stream-storage';

export async function handleSecureFileStreamGet(request: NextRequest) {
  const streamRequest = parseSecureFileStreamRequest(request);

  const sessionResult = await requireSecureFileStreamSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  if (!streamRequest.filePath) {
    return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
  }

  const contextError = await validateSecureFileStreamContext({
    session: sessionResult.session,
    applicantId: streamRequest.applicantId,
    headcountId: streamRequest.headcountId,
  });
  if (contextError) {
    return contextError;
  }

  try {
    return await streamSecureFileObject(request, streamRequest);
  } catch (err) {
    return await handleSecureFileStreamError({
      request,
      context: streamRequest,
      requestedBy: sessionResult.session.user.id,
      err,
    });
  }
}
