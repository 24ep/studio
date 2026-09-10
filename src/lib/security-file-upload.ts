import type { SecurityValidationResult } from './security-types';
import { sanitizePath } from './security-sanitize';

const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.rtf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.xlsx',
  '.xls',
  '.csv',
];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

export async function validateFileUpload(
  filename: string,
  mimetype: string,
  size: number
): Promise<SecurityValidationResult> {
  const errors: string[] = [];
  const { securityConfig } = await import('@/lib/securityConfig');
  const maxSize = securityConfig.fileUpload.maxSize;

  if (size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }

  if (sanitizePath(filename) !== filename) {
    errors.push('Invalid filename');
  }

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    errors.push('File type not allowed');
  }

  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    errors.push('MIME type not allowed');
  }

  return { valid: errors.length === 0, errors };
}
