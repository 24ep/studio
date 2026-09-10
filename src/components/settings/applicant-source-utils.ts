import type { ApplicantSource } from '@/lib/types';
import {
  getJsonErrorMessage,
  getJsonString,
  readJsonObject,
  readJsonOrFallback,
} from '../../lib/response-json';

export type ApplicantSourceSettingsFormData = {
  name: string;
  description?: string;
  email?: string;
  allowSubSource: boolean;
  sortOrder: number;
  isActive: boolean;
  logo?: unknown;
};

export type ApplicantSourceSaveMode = 'create' | 'update';

export type ApplicantSourceSaveResult = {
  mode: ApplicantSourceSaveMode;
  source: ApplicantSource;
};

export function getApplicantSourceErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

export function isApplicantSourceNetworkError(error: unknown) {
  return getApplicantSourceErrorMessage(error, '').includes('Failed to fetch');
}

export function isApplicantSourceLogoUpload(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

export async function uploadApplicantSourceLogo(
  file: Blob,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'Applicant-source-logo');

  const response = await fetchFn('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload logo');
  }

  return getJsonString(await readJsonObject(response), 'url') ?? null;
}

export function buildApplicantSourcePayload(
  data: ApplicantSourceSettingsFormData,
  logoUrl: string | null,
) {
  return {
    ...data,
    logo: logoUrl,
  };
}

export async function saveApplicantSource(
  data: ApplicantSourceSettingsFormData,
  editingSource: ApplicantSource | null,
  fetchFn: typeof fetch = fetch,
): Promise<ApplicantSourceSaveResult> {
  const mode: ApplicantSourceSaveMode = editingSource ? 'update' : 'create';
  let logoUrl = editingSource?.logo || null;

  if (isApplicantSourceLogoUpload(data.logo)) {
    logoUrl = await uploadApplicantSourceLogo(data.logo, fetchFn);
  }

  const response = await fetchFn(
    editingSource
      ? `/api/settings/applicant-sources/${editingSource.id}`
      : '/api/settings/applicant-sources',
    {
      method: editingSource ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApplicantSourcePayload(data, logoUrl)),
    },
  );

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to save source'));
  }

  return {
    mode,
    source: await readJsonOrFallback<ApplicantSource>(response, editingSource ?? {} as ApplicantSource),
  };
}

export function applyApplicantSourceSaveResult(
  sources: ApplicantSource[],
  result: ApplicantSourceSaveResult,
) {
  if (result.mode === 'update') {
    return sources.map(source => (
      source.id === result.source.id ? result.source : source
    ));
  }

  return [...sources, result.source];
}
