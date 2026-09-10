import { type NextRequest } from 'next/server';

export type SecureFileStreamRequest = {
  filePath: string;
  fileName: string | undefined;
  applicantId: string | null;
  headcountId: string | null;
};

export function parseSecureFileStreamRequest(request: NextRequest): SecureFileStreamRequest {
  const url = new URL(request.url);

  return {
    filePath: url.searchParams.get('filePath') || '',
    fileName: url.searchParams.get('fileName') || undefined,
    applicantId: url.searchParams.get('applicantId'),
    headcountId: url.searchParams.get('headcountId'),
  };
}

export function isStreamImage(filePath: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filePath);
}

export function parseStreamRangeHeader(range: string, size: number) {
  const match = /bytes=(\d+)-(\d*)/.exec(range);
  if (!match) {
    return null;
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : size - 1;
  return { start, end, chunkSize: end - start + 1 };
}
