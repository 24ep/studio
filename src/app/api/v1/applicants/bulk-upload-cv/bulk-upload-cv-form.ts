import { type NextRequest } from 'next/server';
import { extractAdditionalAttachments, extractPrimaryFile } from './bulk-upload-cv-files';
import { getFormStringValue } from './bulk-upload-cv-form-values';
import { errorResponse } from './bulk-upload-cv-response';
import type { ParsedBulkUploadCvRequest } from './bulk-upload-cv-types';
import { validateBulkUploadCvFields } from './bulk-upload-cv-validation';

function getNullableFormString(formData: FormData, ...keys: string[]): string | null {
  const value = getFormStringValue(formData, ...keys);
  return value && value !== 'null' ? value : null;
}

export async function parseBulkUploadCvRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return {
      ok: false as const,
      response: errorResponse(request, 'Content-Type must be multipart/form-data', 400),
    };
  }

  const formData = await request.formData();
  const { file, fieldName } = extractPrimaryFile(formData);
  if (!file) {
    return { ok: false as const, response: errorResponse(request, 'No file uploaded', 400) };
  }

  const positionId = getFormStringValue(formData, 'positionId', 'position_id');
  const sourceId = getNullableFormString(formData, 'sourceId', 'source_id');
  const subSource = getNullableFormString(formData, 'subSource', 'sub_source');

  if (!positionId) {
    return { ok: false as const, response: errorResponse(request, 'Missing positionId', 400) };
  }

  const validationError = validateBulkUploadCvFields(request, file, positionId, sourceId);
  if (validationError) {
    return { ok: false as const, response: validationError };
  }

  return {
    ok: true as const,
    data: {
      file,
      additionalAttachments: extractAdditionalAttachments(formData, fieldName),
      positionId,
      sourceId,
      subSource,
    } satisfies ParsedBulkUploadCvRequest,
  };
}
