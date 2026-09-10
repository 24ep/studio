import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  hasPermission: vi.fn(),
  count: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/permissions', () => ({ hasPermission: mocks.hasPermission }));
vi.mock('@/lib/prisma', () => ({
  default: {
    webhookLog: {
      count: mocks.count,
      findMany: mocks.findMany,
    },
  },
}));

import { GET } from './route';

const context = {
  params: Promise.resolve({ id: 'webhook-1' }),
};

function request() {
  return new NextRequest('http://localhost/api/settings/webhooks/webhook-1/logs?page=1&limit=20');
}

describe('GET per-webhook delivery logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.hasPermission.mockReturnValue(false);
    mocks.count.mockResolvedValue(0);
    mocks.findMany.mockResolvedValue([]);
  });

  it('requires authentication', async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await GET(request(), context);

    expect(response.status).toBe(401);
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it('rejects a signed-in user without WEBHOOKS_VIEW or LOGS_VIEW', async () => {
    const response = await GET(request(), context);

    expect(response.status).toBe(403);
    expect(mocks.hasPermission).toHaveBeenCalledWith(expect.anything(), 'WEBHOOKS_VIEW');
    expect(mocks.hasPermission).toHaveBeenCalledWith(expect.anything(), 'LOGS_VIEW');
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it('allows WEBHOOKS_VIEW users to read delivery logs', async () => {
    mocks.hasPermission.mockImplementation((_user, permission) => permission === 'WEBHOOKS_VIEW');

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(mocks.count).toHaveBeenCalledWith({ where: { webhook_id: 'webhook-1' } });
    expect(mocks.findMany).toHaveBeenCalled();
  });

  it('allows LOGS_VIEW users to read delivery logs', async () => {
    mocks.hasPermission.mockImplementation((_user, permission) => permission === 'LOGS_VIEW');

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalled();
  });
});
