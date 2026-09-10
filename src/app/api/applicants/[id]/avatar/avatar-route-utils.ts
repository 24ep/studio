import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';

export const MAX_AVATAR_SIZE_BYTES = 500 * 1024 * 1024;

export interface ValidAvatarFile {
  ok: true;
  file: File;
}

export interface InvalidAvatarFile {
  ok: false;
  message: string;
}

export type AvatarFileValidationResult = ValidAvatarFile | InvalidAvatarFile;

export function extractApplicantIdFromAvatarRequest(request: NextRequest): string | null {
  const match = request.url.match(/\/applicants\/([\w-]+)\/avatar/);
  return match ? match[1] : null;
}

export function getAvatarRouteErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  return error instanceof Error ? error.message : fallback;
}

export function validateAvatarUploadFile(file: FormDataEntryValue | null): AvatarFileValidationResult {
  if (!file || typeof file === 'string') {
    return { ok: false, message: 'No file uploaded' };
  }

  if (!file.type.startsWith('image/')) {
    return { ok: false, message: 'Invalid file type. Only image files are allowed.' };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { ok: false, message: 'File too large. Maximum size is 500MB.' };
  }

  return { ok: true, file };
}

export function buildAvatarObjectName(applicantId: string, fileName: string, idFactory: () => string = randomUUID): string {
  const extension = resolveAvatarFileExtension(fileName);
  return `avatars/${applicantId}/${idFactory()}.${extension}`;
}

export function buildAvatarPreviewUrl(objectName: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:8021';
  return `${baseUrl}/api/secure-file/preview?filePath=${encodeURIComponent(objectName)}`;
}

export function buildPublicReadBucketPolicy(bucketName: string) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  } as const;
}

function resolveAvatarFileExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return extension || 'jpg';
}
