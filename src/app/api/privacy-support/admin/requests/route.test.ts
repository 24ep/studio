import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  query: vi.fn(),
  transaction: vi.fn(),
  employeeContext: vi.fn(),
  isAdmin: vi.fn(),
  logAudit: vi.fn(),
  upsertProjection: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRawUnsafe: mocks.query,
    $transaction: mocks.transaction,
  },
}));
vi.mock('@/lib/privacy-support', () => ({
  employeeContext: mocks.employeeContext,
  isPrivacySupportAdmin: mocks.isAdmin,
}));
vi.mock('@/lib/auditLog', () => ({ logAudit: mocks.logAudit }));
vi.mock('@/lib/hris/task-projection', () => ({ upsertHrisTaskProjection: mocks.upsertProjection }));

import { GET, PATCH } from './route';

const adminId = '5e3516d5-2c63-42e6-ab6f-6f87a9bbd06b';
const companyId = 'a938180f-f474-42bb-9d41-d4f5943d50d3';
const requestId = '2a42bd06-bcae-44e4-a9ca-f255d1d0713a';

describe('HR service desk API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: adminId, name: 'HR Admin', email: 'hr@example.com', role: 'Admin' } });
    mocks.isAdmin.mockReturnValue(true);
    mocks.employeeContext.mockResolvedValue({ id: '3fead887-611f-4983-b40f-034acb0d36f1', companyId });
    mocks.query.mockResolvedValue([]);
    mocks.logAudit.mockResolvedValue({ persisted: true });
    mocks.upsertProjection.mockResolvedValue({ id: 'task-id' });
  });

  it('scopes the HR inbox query to the administrator company', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(mocks.query.mock.calls[0][0]).toContain('r.company_id = $1::uuid');
    expect(mocks.query.mock.calls[0][1]).toBe(companyId);
    expect(mocks.query.mock.calls[0][0]).toContain('service_desk_category_assignees');
  });

  it('rejects non-admin users before querying tickets', async () => {
    mocks.isAdmin.mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('allows an HR user with People management permission to load the inbox', async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: adminId,
        name: 'HR Partner',
        email: 'hr@example.com',
        role: 'Recruiter',
        modulePermissions: ['HR_PEOPLE_MANAGE'],
      },
    });
    mocks.isAdmin.mockImplementation(user => user.modulePermissions?.includes('HR_PEOPLE_MANAGE'));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });

  it('uses company scope when locating a ticket for an update', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/privacy-support/admin/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action: 'close' }),
    }));

    expect(response.status).toBe(404);
    expect(mocks.query.mock.calls[0][0]).toContain('r.company_id = $2::uuid');
    expect(mocks.query.mock.calls[0][2]).toBe(companyId);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
