import type { NextRequest } from 'next/server';

export interface SecureFileRequestContext {
  applicantId: string | null;
  expiresIn: number;
  filePath: string | null;
  headcountId: string | null;
}

export function parseSecureFileRequest(request: NextRequest): SecureFileRequestContext {
  const url = new URL(request.url);

  return {
    filePath: url.searchParams.get('filePath'),
    applicantId: url.searchParams.get('applicantId'),
    headcountId: url.searchParams.get('headcountId'),
    expiresIn: parseSecureFileExpiresIn(url.searchParams.get('expiresIn')),
  };
}

export function parseSecureFileExpiresIn(value: string | null) {
  const expiresIn = Number.parseInt(value || '3600', 10);
  return Number.isNaN(expiresIn) ? 3600 : expiresIn;
}
