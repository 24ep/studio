import { describe, expect, it } from 'vitest';

import { buildMobileNavItems, partitionMobileNavItems } from './MobileBottomNav';

describe('buildMobileNavItems', () => {
  it('keeps employee self-service separate from HR workforce operations', () => {
    const items = buildMobileNavItems({
      role: 'Employee',
      modulePermissions: ['TASK_BOARD_MANAGE_OWN'],
    });

    expect(items.map(item => item.label)).toEqual(['Home', 'ESS', 'Growth']);
    expect(items.find(item => item.label === 'ESS')?.href).toBe('/ess/profile');
    expect(items.some(item => item.label === 'Workforce')).toBe(false);
    expect(items.some(item => item.label === 'Leave')).toBe(false);
  });

  it('matches desktop IA by splitting ESS, Workforce, and Leave for permitted HR users', () => {
    const items = buildMobileNavItems({
      role: 'Hiring Manager',
      modulePermissions: [
        'TASK_BOARD_VIEW',
        'HR_WORKFORCE_VIEW',
        'HR_PEOPLE_VIEW',
        'applicantS_VIEW',
        'HR_PAYROLL_VIEW',
        'EXPENSES_VIEW',
      ],
    });

    expect(items.map(item => item.label)).toEqual([
      'Home',
      'People',
      'ESS',
      'Workforce',
      'Leave',
      'Pay',
      'Hiring',
      'Growth',
    ]);
    expect(items.find(item => item.label === 'ESS')?.href).toBe('/ess/profile');
    expect(items.find(item => item.label === 'Workforce')?.href).toBe('/workforce/attendance?view=attendance');
    expect(items.find(item => item.label === 'Leave')?.href).toBe('/workforce/leave');
    expect(items.find(item => item.label === 'Pay')?.href).toBe('/payroll');
  });

  it('uses expenses as the Pay destination when payroll access is unavailable', () => {
    const items = buildMobileNavItems({
      role: 'Employee',
      modulePermissions: ['EXPENSES_VIEW'],
    });

    expect(items.find(item => item.label === 'Pay')?.href).toBe('/expenses');
  });

  it('never exposes Admin without system settings permission', () => {
    const employeeItems = buildMobileNavItems({ role: 'Employee', modulePermissions: [] });
    const adminItems = buildMobileNavItems({ role: 'Admin', modulePermissions: [] });

    expect(employeeItems.some(item => item.label === 'Admin')).toBe(false);
    expect(adminItems.some(item => item.label === 'Admin')).toBe(true);
  });
});

describe('partitionMobileNavItems', () => {
  const item = (label: string) => ({ href: `/${label.toLowerCase()}`, label, icon: () => null });

  it('keeps five or fewer destinations directly in the bar', () => {
    const items = ['Home', 'People', 'ESS', 'Workforce', 'Leave'].map(item);

    expect(partitionMobileNavItems(items)).toEqual({
      primaryItems: items,
      overflowItems: [],
    });
  });

  it('reserves the fifth slot for More and preserves every overflow destination', () => {
    const items = ['Home', 'People', 'ESS', 'Workforce', 'Leave', 'Pay', 'Hiring', 'Growth', 'Admin'].map(item);
    const { primaryItems, overflowItems } = partitionMobileNavItems(items);

    expect(primaryItems.map(entry => entry.label)).toEqual(['Home', 'People', 'ESS', 'Workforce']);
    expect(overflowItems.map(entry => entry.label)).toEqual(['Leave', 'Pay', 'Hiring', 'Growth', 'Admin']);
    expect([...primaryItems, ...overflowItems]).toEqual(items);
  });
});
