import { describe, expect, it, vi } from 'vitest';

import { createHriveClient, HriveApiError } from './index';

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    status: 200,
    headers: { 'content-type': 'application/json', ...init.headers },
    ...(init.status ? { status: init.status } : {}),
  });
}

describe('Hrive SDK', () => {
  it('logs in, stores the token, and authenticates later module requests', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({
        success: true,
        data: {
          success: true,
          token: 'jwt-token',
          user: { id: '1', email: 'admin@example.com', role: 'Admin', modulePermissions: [] },
        },
      }))
      .mockResolvedValueOnce(json({
        success: true,
        data: { status: 'healthy', timestamp: '2026-08-08T00:00:00Z' },
      }));
    const client = createHriveClient({ baseUrl: 'https://hr.example.com/', fetch: fetcher });

    await client.auth.login({ email: 'admin@example.com', password: 'secret' });
    await client.health.get();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[0].toString()).toBe('https://hr.example.com/api/v1/auth/login');
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      email: 'admin@example.com',
      password: 'secret',
    });
    expect(new Headers(fetcher.mock.calls[1]?.[1]?.headers).get('authorization')).toBe('Bearer jwt-token');
  });

  it('encodes identifiers and repeated query parameters', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json({ data: [], total: 0 }));
    const client = createHriveClient({ baseUrl: 'https://hr.example.com', accessToken: 'token', fetch: fetcher });

    await client.applicants.list({ status: ['new', 'screening'], page: 2 });
    await client.applicants.getById('candidate/with spaces');

    const listUrl = new URL(fetcher.mock.calls[0]?.[0].toString() || '');
    expect(listUrl.searchParams.getAll('status')).toEqual(['new', 'screening']);
    expect(listUrl.searchParams.get('page')).toBe('2');
    expect(fetcher.mock.calls[1]?.[0].toString()).toContain('/candidate%2Fwith%20spaces');
  });

  it('leaves multipart content type generation to fetch', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ success: true }));
    const client = createHriveClient({ baseUrl: 'https://hr.example.com', fetch: fetcher });
    const form = new FormData();
    form.set('file', new Blob(['resume']), 'resume.txt');

    await client.applicants.bulkUploadCv(form);

    const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers);
    expect(headers.has('content-type')).toBe(false);
    expect(fetcher.mock.calls[0]?.[1]?.body).toBe(form);
  });

  it('throws a structured API error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(
      { error: 'Permission denied', details: { permission: 'USERS_VIEW' } },
      { status: 403, statusText: 'Forbidden', headers: { 'x-request-id': 'req-123' } },
    ));
    const client = createHriveClient({ baseUrl: 'https://hr.example.com', fetch: fetcher });

    const promise = client.users.list();
    await expect(promise).rejects.toMatchObject({
      name: 'HriveApiError',
      message: 'Permission denied',
      status: 403,
      requestId: 'req-123',
    } satisfies Partial<HriveApiError>);
  });

  it('retries safe requests on transient server errors', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ error: 'Unavailable' }, { status: 503 }))
      .mockResolvedValueOnce(json({ success: true, data: { status: 'healthy', timestamp: 'now' } }));
    const client = createHriveClient({ baseUrl: 'https://hr.example.com', fetch: fetcher, retries: 1 });

    await expect(client.health.get()).resolves.toMatchObject({ data: { status: 'healthy' } });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('exposes all public v1 feature modules and a raw escape hatch', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ ok: true }));
    const client = createHriveClient({ baseUrl: 'https://hr.example.com', fetch: fetcher });

    expect(Object.keys(client)).toEqual(expect.arrayContaining([
      'auth', 'applicants', 'applicantSources', 'positions', 'evaluations', 'users',
      'dashboard', 'health', 'jobMatchStatus', 'recruitmentStages', 'transitions',
      'settings', 'logs', 'notifications', 'uploadQueue', 'ai',
    ]));
    await client.request('GET', '/api/v1/future-module');
    expect(fetcher.mock.calls[0]?.[0].toString()).toBe('https://hr.example.com/api/v1/future-module');
  });
});
