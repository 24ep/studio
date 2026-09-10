import { describe, expect, it } from 'vitest';

import { getExpenseAccess, maskPaymentDestination } from './permissions';

describe('expense permissions', () => {
  it('allows linked employees to create only their own workflow data', () => {
    expect(getExpenseAccess({ role: 'Employee', modulePermissions: [] }, true)).toMatchObject({
      canCreate: true,
      canApprove: false,
      canFinance: false,
      canAudit: false,
    });
  });

  it('grants finance capability only with backend permission', () => {
    expect(getExpenseAccess({
      role: 'Finance',
      modulePermissions: ['EXPENSES_FINANCE'],
    }, true).canFinance).toBe(true);
  });

  it('masks payment destinations', () => {
    expect(maskPaymentDestination('TH12 3456 7890 4821')).toBe('Account ending 4821');
  });
});
