import { describe, expect, it, vi } from 'vitest';

import {
  applyApplicantSourceSaveResult,
  buildApplicantSourcePayload,
  getApplicantSourceErrorMessage,
  isApplicantSourceLogoUpload,
  isApplicantSourceNetworkError,
  saveApplicantSource,
} from './applicant-source-settings-utils';
import { reorderApplicantSourceList } from './applicant-sources-tab-api';
import type { ApplicantSource } from '@/lib/types';

const makeSource = (overrides: Partial<ApplicantSource> = {}): ApplicantSource => ({
  id: 'source-1',
  name: 'LinkedIn',
  description: null,
  email: null,
  logo: null,
  allowSubSource: false,
  sortOrder: 0,
  isActive: true,
  ...overrides,
});

const makeResponse = (body: unknown, ok = true) => ({
  ok,
  json: async () => body,
}) as Response;

describe('applicant source settings utilities', () => {
  it('detects uploaded logo values without treating existing URLs as files', () => {
    expect(isApplicantSourceLogoUpload(new Blob(['logo']))).toBe(true);
    expect(isApplicantSourceLogoUpload('/uploads/logo.png')).toBe(false);
    expect(isApplicantSourceLogoUpload(null)).toBe(false);
  });

  it('builds source payloads with the resolved logo URL', () => {
    expect(buildApplicantSourcePayload({
      name: 'Referral',
      description: '',
      email: '',
      allowSubSource: true,
      sortOrder: 2,
      isActive: true,
      logo: new Blob(['logo']),
    }, '/uploads/referral.png')).toMatchObject({
      name: 'Referral',
      allowSubSource: true,
      sortOrder: 2,
      isActive: true,
      logo: '/uploads/referral.png',
    });
  });

  it('creates applicant sources and uploads new logo blobs first', async () => {
    const createdSource = makeSource({ id: 'created-source', name: 'Agency', logo: '/uploads/agency.png' });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (input === '/api/upload-image') {
        return makeResponse({ url: '/uploads/agency.png' });
      }

      return makeResponse(createdSource);
    }) as unknown as typeof fetch;

    const result = await saveApplicantSource({
      name: 'Agency',
      description: 'External recruiter',
      email: 'agency@example.com',
      allowSubSource: false,
      sortOrder: 1,
      isActive: true,
      logo: new Blob(['logo']),
    }, null, fetchMock);

    expect(result).toEqual({ mode: 'create', source: createdSource });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/upload-image', expect.objectContaining({
      method: 'POST',
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/settings/applicant-sources', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('/uploads/agency.png'),
    }));
  });

  it('updates applicant sources and preserves the existing logo when no upload is provided', async () => {
    const editingSource = makeSource({ id: 'source-2', logo: '/uploads/current.png' });
    const updatedSource = makeSource({ id: 'source-2', name: 'Updated', logo: '/uploads/current.png' });
    const fetchMock = vi.fn(async () => makeResponse(updatedSource)) as unknown as typeof fetch;

    const result = await saveApplicantSource({
      name: 'Updated',
      description: '',
      email: '',
      allowSubSource: false,
      sortOrder: 3,
      isActive: true,
    }, editingSource, fetchMock);

    expect(result).toEqual({ mode: 'update', source: updatedSource });
    expect(fetchMock).toHaveBeenCalledWith('/api/settings/applicant-sources/source-2', expect.objectContaining({
      method: 'PUT',
      body: expect.stringContaining('/uploads/current.png'),
    }));
  });

  it('applies create and update results to local state', () => {
    const existing = makeSource({ id: 'existing-source', name: 'Existing' });
    const created = makeSource({ id: 'created-source', name: 'Created' });
    const updated = makeSource({ id: 'existing-source', name: 'Updated' });

    expect(applyApplicantSourceSaveResult([existing], { mode: 'create', source: created })).toEqual([
      existing,
      created,
    ]);
    expect(applyApplicantSourceSaveResult([existing, created], { mode: 'update', source: updated })).toEqual([
      updated,
      created,
    ]);
  });

  it('reorders sources and refreshes sort order values', () => {
    const first = makeSource({ id: 'first', name: 'First', sortOrder: 1 });
    const second = makeSource({ id: 'second', name: 'Second', sortOrder: 2 });
    const third = makeSource({ id: 'third', name: 'Third', sortOrder: 3 });

    expect(reorderApplicantSourceList([first, second, third], 2, 0)).toMatchObject([
      { id: 'third', sortOrder: 1 },
      { id: 'first', sortOrder: 2 },
      { id: 'second', sortOrder: 3 },
    ]);
  });

  it('normalizes unknown errors for applicant source UI messages', () => {
    expect(getApplicantSourceErrorMessage(new Error('Failed to save'), 'Fallback')).toBe('Failed to save');
    expect(getApplicantSourceErrorMessage('bad', 'Fallback')).toBe('Fallback');
    expect(getApplicantSourceErrorMessage(new Error('   '), 'Fallback')).toBe('Fallback');
    expect(isApplicantSourceNetworkError(new Error('Failed to fetch'))).toBe(true);
    expect(isApplicantSourceNetworkError(new Error('Other'))).toBe(false);
  });
});
