import { NextResponse, type NextRequest } from 'next/server';
import { getSignedUrl } from '@/lib/minio';
import { requireSecureFileSession, validateSecureFileContext } from './secure-file-auth';
import { parseSecureFileRequest } from './secure-file-request';

export async function handleSecureFileGet(request: NextRequest) {
  const sessionResult = await requireSecureFileSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const secureFileRequest = parseSecureFileRequest(request);
  if (!secureFileRequest.filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  try {
    const contextError = await validateSecureFileContext({
      session: sessionResult.session,
      applicantId: secureFileRequest.applicantId,
      headcountId: secureFileRequest.headcountId,
    });
    if (contextError) {
      return contextError;
    }

    const signedUrl = await getSignedUrl(secureFileRequest.filePath, secureFileRequest.expiresIn);

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn: secureFileRequest.expiresIn,
      message: 'Secure file access URL generated',
    });
  } catch (error) {
    console.error('[SECURE-FILE] Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate secure file access URL' },
      { status: 500 },
    );
  }
}
