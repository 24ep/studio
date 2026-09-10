import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchBulkUploadSources, uploadBulkCvFiles } from './bulk-upload-cvs-api';

function response(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function file(name: string) {
  return new File(['pdf'], name, { type: 'application/pdf' });
}

describe('bulk upload CV API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads applicant sources with credentials', async () => {
    const sources = [{ id: 'source-1', name: 'LinkedIn' }];
    const fetchMock = vi.fn().mockResolvedValue(response(sources));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchBulkUploadSources()).resolves.toEqual(sources);
    expect(fetchMock).toHaveBeenCalledWith('/api/settings/applicant-sources', {
      credentials: 'include',
    });
  });

  it('uploads files with queue metadata and summarizes the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      summary: { success: 1, failed: 1 },
      results: [
        { status: 'success', file_name: 'a.pdf' },
        { status: 'failed', file_name: 'b.pdf', error: 'Unreadable' },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadBulkCvFiles({
      files: [file('a.pdf'), file('b.pdf')],
      batchId: 'batch-1',
      positionId: 'position-1',
      sourceId: 'source-1',
      subSource: 'campaign',
    })).resolves.toMatchObject({
      successful: 1,
      failed: 1,
      errors: ['b.pdf: Unreadable'],
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/upload-queue/upload-file', expect.objectContaining({
      method: 'POST',
      signal: expect.any(AbortSignal),
    }));
    const formData = fetchMock.mock.calls[0][1].body as FormData;
    expect(formData.getAll('files')).toHaveLength(2);
    expect(formData.get('batch_id')).toBe('batch-1');
    expect(formData.get('position_id')).toBe('position-1');
    expect(formData.get('source_id')).toBe('source-1');
    expect(formData.get('sub_source')).toBe('campaign');
    expect(formData.get('source')).toBe('bulk');
  });

  it('surfaces upload API errors and network errors', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ error: 'Storage service unavailable' }, false, 503))
      .mockRejectedValueOnce(new TypeError('fetch failed')));

    await expect(uploadBulkCvFiles({ files: [file('a.pdf')], batchId: 'batch-1' })).rejects.toThrow('Storage service unavailable');
    await expect(uploadBulkCvFiles({ files: [file('a.pdf')], batchId: 'batch-1' })).rejects.toThrow('Network error');
  });

  it('treats client upload timeout as queued work instead of a failed upload', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await expect(uploadBulkCvFiles({
      files: [file('a.pdf'), file('b.pdf')],
      batchId: 'batch-1',
      timeoutMs: 1,
    })).resolves.toMatchObject({
      success: true,
      successful: 2,
      failed: 0,
      queuedAfterTimeout: true,
    });
  });
});
