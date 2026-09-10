import { NextRequest, NextResponse } from 'next/server';
import { requireDownloadRouteSession } from './download-route-auth';
import { verifyDownloadFileAccess } from './download-route-access';
import { parseDownloadRouteRequest } from './download-route-request';
import { createDownloadResponse, resolveDownloadFileName } from './download-route-response';
import { getDownloadedStorageFile } from './download-route-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionResult = await requireDownloadRouteSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const requestContext = parseDownloadRouteRequest(request);
  if (!requestContext.fileUrl && !requestContext.filePath) {
    return NextResponse.json({ error: 'File URL or file path is required' }, { status: 400 });
  }

  if (!requestContext.filePath) {
    return NextResponse.json({ error: 'Legacy URL-based access is no longer supported for security reasons' }, { status: 400 });
  }

  const accessError = await verifyDownloadFileAccess(requestContext, sessionResult.session);
  if (accessError) {
    return accessError;
  }

  try {
    const downloadedFile = await getDownloadedStorageFile(requestContext.filePath);
    if (downloadedFile.buffer.byteLength === 0) {
      return NextResponse.json({ error: 'Downloaded file is empty' }, { status: 400 });
    }

    return createDownloadResponse({
      buffer: downloadedFile.buffer,
      contentType: downloadedFile.contentType,
      fileName: resolveDownloadFileName(requestContext),
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
