import { type NextRequest } from 'next/server';
import { validate as validateUuid } from 'uuid';
import { errorResponse } from './bulk-upload-cv-response';

const SUPPORTED_RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
]);
const SUPPORTED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

export function validateBulkUploadCvFields(
  request: NextRequest,
  file: File,
  positionId: string,
  sourceId: string | null
) {
  if (!validateUuid(positionId)) {
    return errorResponse(request, `Invalid positionId format: "${positionId}". Must be a valid UUID.`, 400);
  }

  if (sourceId && !validateUuid(sourceId)) {
    return errorResponse(request, `Invalid sourceId format: "${sourceId}". Must be a valid UUID.`, 400);
  }

  const lowerName = file.name.toLowerCase();
  const hasSupportedExtension = SUPPORTED_RESUME_EXTENSIONS.some(extension => lowerName.endsWith(extension));

  if (!SUPPORTED_RESUME_MIME_TYPES.has(file.type) && !hasSupportedExtension) {
    return errorResponse(request, `Invalid file type: "${file.type}". Supported files: PDF, Word documents, JPG, PNG, GIF, WEBP, and BMP.`, 400);
  }

  return null;
}
