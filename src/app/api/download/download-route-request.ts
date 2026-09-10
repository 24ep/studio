import type { NextRequest } from 'next/server';

export interface DownloadRouteRequestContext {
  fileUrl: string | null;
  fileName: string | null;
  filePath: string | null;
  applicantId: string | null;
  headcountId: string | null;
}

export function parseDownloadRouteRequest(request: NextRequest): DownloadRouteRequestContext {
  const url = new URL(request.url);

  return {
    fileUrl: url.searchParams.get('url'),
    fileName: url.searchParams.get('fileName'),
    filePath: url.searchParams.get('filePath'),
    applicantId: url.searchParams.get('applicantId'),
    headcountId: url.searchParams.get('headcountId'),
  };
}
