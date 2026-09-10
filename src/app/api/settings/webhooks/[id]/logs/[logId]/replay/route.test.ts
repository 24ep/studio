import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  hasPermission: vi.fn(),
  findFirst: vi.fn(),
  replayWebhook: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/permissions', () => ({ hasPermission: mocks.hasPermission }));
vi.mock('@/lib/prisma', () => ({
  default: {
    webhookLog: {
      findFirst: mocks.findFirst,
    },
  },
}));
vi.mock('@/lib/webhookService', () => ({
  WebhookService: {
    replayWebhook: mocks.replayWebhook,
  },
}));

import { POST } from './route';

const context = {
  params: Promise.resolve({ id: 'webhook-1', logId: 'log-1' }),
};

const storedPayload = {
  event: 'employee.updated',
  timestamp: '2026-09-05T04:30:00.000Z',
  data: {
    employee: {
      external_id: 'EMP-001',
      display_name: 'Example Employee',
    },
  },
  webhook_id: 'webhook-1',
  metadata: {
    template_used: true,
  },
};

function failedLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1',
    success: false,
    payload: storedPayload,
    webhook: {
      id: 'webhook-1',
      is_active: true,
    },
    ...overrides,
  };
}

describe('POST webhook delivery replay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.hasPermission.mockReturnValue(true);
    mocks.findFirst.mockResolvedValue(failedLog());
    mocks.replayWebhook.mockResolvedValue({
      success: true,
      status: 200,
      duration_ms: 12,
    });
  });

  it('requires authentication', async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost/replay', { method: 'POST' }), context);

    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it('requires WEBHOOKS_EDIT permission', async () => {
    mocks.hasPermission.mockReturnValue(false);

    const response = await POST(new Request('http://localhost/replay', { method: 'POST' }), context);

    expect(response.status).toBe(403);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it('does not replay successful deliveries', async () => {
    mocks.findFirst.mockResolvedValue(failedLog({ success: true }));

    const response = await POST(new Request('http://localhost/replay', { method: 'POST' }), context);

    expect(response.status).toBe(409);
    expect(mocks.replayWebhook).not.toHaveBeenCalled();
  });

  it('does not replay an inactive webhook', async () => {
    mocks.findFirst.mockResolvedValue(failedLog({
      webhook: { id: 'webhook-1', is_active: false },
    }));

    const response = await POST(new Request('http://localhost/replay', { method: 'POST' }), context);

    expect(response.status).toBe(409);
    expect(mocks.replayWebhook).not.toHaveBeenCalled();
  });

  it('replays the exact stored processed payload through the webhook service', async () => {
    const response = await POST(new Request('http://localhost/replay', { method: 'POST' }), context);

    expect(response.status).toBe(200);
    expect(mocks.replayWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'webhook-1' }),
      storedPayload
    );
    await expect(response.json()).resolves.toMatchObject({
      replayed: true,
      success: true,
      status: 200,
    });
  });

  it('rejects legacy or malformed logs that cannot be replayed faithfully', async () => {
    mocks.findFirst.mockResolvedValue(failedLog({
      payload: { event: 'employee.updated', data: { employeeId: 'employee-1' } },
    }));

    const response = await POST(new Request('http://localhost/replay', { method: 'POST' }), context);

    expect(response.status).toBe(422);
    expect(mocks.replayWebhook).not.toHaveBeenCalled();
  });

  it('surfaces a failed replay without pretending recovery succeeded', async () => {
    mocks.replayWebhook.mockResolvedValue({
      success: false,
      status: 503,
      error: 'HTTP 503',
      duration_ms: 18,
    });

    const response = await POST(new Request('http://localhost/replay', { method: 'POST' }), context);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      replayed: true,
      success: false,
      status: 503,
      error: 'HTTP 503',
    });
  });
});
