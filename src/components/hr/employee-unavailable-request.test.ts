import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_SUPPORT_CATEGORIES } from '@/lib/service-desk-contract';

import { sendEmployeeAccessRequest } from './employee-unavailable-request';

describe('sendEmployeeAccessRequest', () => {
  it('sends the record issue to the account access Talk with HR category', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      id: '3fb4e7a8-1ad0-44e4-8720-5c31180ad831',
      requestNumber: 'HR-10482',
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    const result = await sendEmployeeAccessRequest({
      employeeId: 'EMP-10482',
      issue: 'Employee not found.',
      categories: DEFAULT_SUPPORT_CATEGORIES.map(category => ({ ...category })),
      reference: 'EMP-10482',
      request,
    });

    expect(result).toEqual({
      status: 'sent',
      created: {
        id: '3fb4e7a8-1ad0-44e4-8720-5c31180ad831',
        requestNumber: 'HR-10482',
      },
    });
    expect(request).toHaveBeenCalledOnce();
    const [, init] = request.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      category: 'account_access',
      metadata: { intent: 'request', source: 'employee-record-unavailable', channel: 'human' },
    });
    expect(String(init?.body)).toContain('EMP-10482');
  });

  it('returns a prefilled Talk with HR handoff when the request cannot be sent', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    const result = await sendEmployeeAccessRequest({
      employeeId: 'EMP-10482',
      issue: 'Employee not found.',
      categories: DEFAULT_SUPPORT_CATEGORIES.map(category => ({ ...category })),
      reference: 'EMP-10482',
      request,
    });

    expect(result).toMatchObject({
      status: 'handoff',
      detail: {
        category: 'account_access',
        humanRequested: true,
      },
    });
  });
});
