import { describe, expect, it, vi } from 'vitest';

const redirect = vi.fn();

vi.mock('next/navigation', () => ({ redirect }));

describe('ExpensesPage', () => {
  it('routes the expenses landing page to claims', async () => {
    const { default: ExpensesPage } = await import('./page');

    ExpensesPage();

    expect(redirect).toHaveBeenCalledWith('/expenses/claims');
  });
});
