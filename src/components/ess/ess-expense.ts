export type EmployeeExpenseAction = 'submit' | 'withdraw' | 'resubmit';

export function employeeExpenseQuery({
  search = '',
  status = '',
}: {
  search?: string;
  status?: string;
} = {}) {
  const params = new URLSearchParams({ scope: 'self', pageSize: '50' });
  if (search.trim()) params.set('search', search.trim());
  if (status) params.set('status', status);
  return params;
}

export function employeeExpenseActions(status: string): EmployeeExpenseAction[] {
  if (status === 'draft') return ['submit'];
  if (status === 'returned_for_revision' || status === 'withdrawn') return ['resubmit'];
  if (status.startsWith('pending_')) return ['withdraw'];
  return [];
}
