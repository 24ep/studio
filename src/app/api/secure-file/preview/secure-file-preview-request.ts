import { type NextRequest } from 'next/server';

export type SecureFilePreviewRequest = {
  filePath: string;
  fileName: string | undefined;
  applicantId: string | null;
  headcountId: string | null;
  thumbnail: boolean;
  width: number | null;
  height: number | null;
};

export function parseSecureFilePreviewRequest(request: NextRequest): SecureFilePreviewRequest {
  const url = new URL(request.url);
  const widthParam = url.searchParams.get('width');
  const heightParam = url.searchParams.get('height');

  return {
    filePath: url.searchParams.get('filePath') || '',
    fileName: url.searchParams.get('fileName') || undefined,
    applicantId: url.searchParams.get('applicantId'),
    headcountId: url.searchParams.get('headcountId'),
    thumbnail: url.searchParams.get('thumbnail') === 'true',
    width: widthParam ? parseInt(widthParam, 10) : null,
    height: heightParam ? parseInt(heightParam, 10) : null,
  };
}

export function isSettingsPreviewImage(filePath: string, applicantId: string | null) {
  return filePath.startsWith('settings/')
    || filePath.startsWith('Applicant-source-logo/')
    || (filePath.startsWith('profile-images/') && !applicantId);
}

export function isPreviewImage(filePath: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filePath);
}

export function shouldResizePreviewImage(input: Pick<SecureFilePreviewRequest, 'filePath' | 'thumbnail' | 'width' | 'height'>) {
  return isPreviewImage(input.filePath) && (input.thumbnail || input.width || input.height);
}
