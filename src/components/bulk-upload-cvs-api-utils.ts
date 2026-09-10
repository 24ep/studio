import { getJsonErrorMessage, readJsonObject } from '../lib/response-json';

interface BuildBulkCvFormDataOptions {
  batchId: string;
  files: File[];
  positionId?: string;
  sourceId?: string;
  subSource?: string;
}

export function buildBulkCvUploadFormData({
  batchId,
  files,
  positionId,
  sourceId,
  subSource,
}: BuildBulkCvFormDataOptions): FormData {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  appendOptionalFormField(formData, 'position_id', positionId);
  appendOptionalFormField(formData, 'source_id', sourceId);
  appendOptionalFormField(formData, 'sub_source', subSource);
  formData.append('batch_id', batchId);
  formData.append('source', 'bulk');

  return formData;
}

export function createBulkUploadAbortController(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return { controller, timeoutId };
}

export async function readBulkUploadError(response: Response): Promise<string> {
  const errorData = await readJsonObject(response);
  return getJsonErrorMessage(errorData, 'Failed to upload files');
}

export function isBulkUploadAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function normalizeBulkUploadCaughtError(error: unknown): Error {
  if (error instanceof Error) {
    if (isBulkUploadAbortError(error)) {
      return new Error('Upload timed out. Please try again with fewer files or smaller files.');
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Error('Network error. Please check your connection and try again.');
    }
  }

  return error instanceof Error ? error : new Error(String(error));
}

function appendOptionalFormField(formData: FormData, key: string, value: string | undefined): void {
  if (value) {
    formData.append(key, value);
  }
}
