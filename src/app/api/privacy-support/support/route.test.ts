import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  query: vi.fn(),
  transaction: vi.fn(),
  consumeSubmission: vi.fn(),
  employeeContext: vi.fn(),
  requestNumber: vi.fn(),
  logAudit: vi.fn(),
  updateProjection: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRawUnsafe: mocks.query,
    $transaction: mocks.transaction,
  },
}));
vi.mock('@/lib/privacy-support', () => ({
  consumeSubmission: mocks.consumeSubmission,
  employeeContext: mocks.employeeContext,
  requestNumber: mocks.requestNumber,
}));
vi.mock('@/lib/auditLog', () => ({ logAudit: mocks.logAudit }));
vi.mock('@/lib/hris/task-projection', () => ({ updateHrisTaskProjectionStatus: mocks.updateProjection }));

import { PATCH, POST } from './route';

const userId = '5e3516d5-2c63-42e6-ab6f-6f87a9bbd06b';
const requestId = '2a42bd06-bcae-44e4-a9ca-f255d1d0713a';

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/privacy-support/support', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('employee service desk API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: userId, name: 'Employee', email: 'employee@example.com', role: 'Employee' } });
    mocks.consumeSubmission.mockReturnValue(true);
    mocks.employeeContext.mockResolvedValue({ id: null, companyId: null });
    mocks.requestNumber.mockReturnValue('SUP-20260808-ABC12345');
    mocks.logAudit.mockResolvedValue({ persisted: true });
    mocks.updateProjection.mockResolvedValue(0);
  });

  it('rejects caller-controlled assignment before consuming the rate limit', async () => {
    const response = await POST(new NextRequest('http://localhost/api/privacy-support/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'general',
        subject: 'A valid support subject',
        description: 'A sufficiently detailed support request.',
        assignedToUserId: userId,
      }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.consumeSubmission).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('prevents replies to terminal tickets', async () => {
    mocks.query.mockResolvedValue([{ status: 'closed' }]);

    const response = await PATCH(patchRequest({ requestId, action: 'reply', message: 'One more detail.' }));

    expect(response.status).toBe(409);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('moves an employee-replied ticket to action required and appends history atomically', async () => {
    const transactionClient = { $executeRawUnsafe: vi.fn().mockResolvedValue(1) };
    mocks.query.mockResolvedValue([{ status: 'in_review' }]);
    mocks.transaction.mockImplementation(async callback => callback(transactionClient));

    const response = await PATCH(patchRequest({ requestId, action: 'reply', message: 'Here is the requested information.' }));

    expect(response.status).toBe(200);
    expect(transactionClient.$executeRawUnsafe).toHaveBeenCalledTimes(2);
    expect(transactionClient.$executeRawUnsafe.mock.calls[0][1]).toBe('action_required');
    expect(mocks.updateProjection).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', client: transactionClient }));
    expect(mocks.logAudit).toHaveBeenCalled();
  });
});
