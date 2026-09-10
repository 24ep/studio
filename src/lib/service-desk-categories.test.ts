import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());
vi.mock('@/lib/prisma', () => ({ default: { $queryRawUnsafe: query } }));

import {
  defaultServiceDeskCategories,
  getServiceDeskCategories,
  isActiveServiceDeskCategory,
} from './service-desk-categories';

describe('service desk category configuration', () => {
  beforeEach(() => query.mockReset());

  it('keeps the established categories until an administrator saves custom routing', async () => {
    query.mockResolvedValue([]);
    const categories = await getServiceDeskCategories(null);

    expect(categories).toEqual(defaultServiceDeskCategories());
    expect(categories.find(category => category.key === 'general')?.label).toBe('General question');
  });

  it('uses active saved categories for ticket validation', async () => {
    query.mockResolvedValue([{
      id: '418df840-b24b-4c18-91bb-a47481ce2943',
      key: 'employee_relations',
      label: 'Employee relations',
      isActive: true,
      sortOrder: 10,
      assigneeIds: ['a4e4470d-d5e1-438f-8dca-fe9346d60fa7'],
    }]);

    await expect(isActiveServiceDeskCategory(null, 'employee_relations')).resolves.toBe(true);
    await expect(isActiveServiceDeskCategory(null, 'payroll')).resolves.toBe(false);
  });

  it('does not restore defaults when every saved category is inactive', async () => {
    query.mockResolvedValue([{
      id: '418df840-b24b-4c18-91bb-a47481ce2943',
      key: 'general',
      label: 'General question',
      isActive: false,
      sortOrder: 10,
      assigneeIds: [],
    }]);

    await expect(getServiceDeskCategories(null)).resolves.toEqual([]);
  });
});
