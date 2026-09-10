import type { ApplicantSource } from '@/lib/types';
import { readJsonOrFallback } from '../lib/response-json';
import { summarizeBulkUploadResponse } from './bulk-upload-cvs-utils';
import {
  buildBulkCvUploadFormData,
  createBulkUploadAbortController,
  isBulkUploadAbortError,
  normalizeBulkUploadCaughtError,
  readBulkUploadError,
} from './bulk-upload-cvs-api-utils';

const DEFAULT_BULK_UPLOAD_TIMEOUT_MS = 120000;

interface UploadBulkCvFilesOptions {
  files: File[];
  batchId: string;
  positionId?: string;
  sourceId?: string;
  subSource?: string;
  timeoutMs?: number;
}

export async function fetchBulkUploadSources(): Promise<ApplicantSource[]> {
  const response = await fetch('/api/settings/applicant-sources', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Applicant sources');
  }

  return readJsonOrFallback<ApplicantSource[]>(response, []);
}

export async function uploadBulkCvFiles({
  files,
  batchId,
  positionId,
  sourceId,
  subSource,
  timeoutMs = DEFAULT_BULK_UPLOAD_TIMEOUT_MS,
}: UploadBulkCvFilesOptions) {
  const formData = buildBulkCvUploadFormData({
    batchId,
    files,
    positionId,
    sourceId,
    subSource,
  });
  const { controller, timeoutId } = createBulkUploadAbortController(timeoutMs);

  try {
    const response = await fetch('/api/upload-queue/upload-file', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await readBulkUploadError(response));
    }

    return summarizeBulkUploadResponse(await readJsonOrFallback<unknown>(response, {}));
  } catch (error) {
    if (isBulkUploadAbortError(error)) {
      return {
        success: true,
        data: null,
        successful: files.length,
        failed: 0,
        errors: [],
        queuedAfterTimeout: true,
      };
    }

    throw normalizeBulkUploadCaughtError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}
