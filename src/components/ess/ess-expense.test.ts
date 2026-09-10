import { describe, expect, it } from 'vitest';

import { employeeExpenseActions, employeeExpenseQuery } from './ess-expense';

describe('ESS expense self-service contract', () => {
  it('always requests the authenticated employee scope', () => {
    expect(employeeExpenseQuery({ search: 'taxi', status: 'pending_manager' }).toString()).toBe(
      'scope=self&pageSize=50&search=taxi&status=pending_manager',
    );
  });

  it('exposes employee actions but never approval or finance actions', () => {
    expect(employeeExpenseActions('draft')).toEqual(['submit']);
    expect(employeeExpenseActions('returned_for_revision')).toEqual(['resubmit']);
    expect(employeeExpenseActions('pending_manager')).toEqual(['withdraw']);
    expect(employeeExpenseActions('approved')).toEqual([]);
    expect(employeeExpenseActions('payment_processing')).toEqual([]);
  });
});
