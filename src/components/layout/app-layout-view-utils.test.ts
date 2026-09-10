import { describe, expect, it } from 'vitest';

import { getAppLayoutBreadcrumbItems, getAppLayoutPageTitle } from './app-layout-view-utils';

describe('app layout view utilities', () => {
  it('derives page titles from pathnames', () => {
    expect(getAppLayoutPageTitle('/')).toBe('Dashboard');
    expect(getAppLayoutPageTitle(null)).toBe('Dashboard');
    expect(getAppLayoutPageTitle('/positions')).toBe('Positions');
    expect(getAppLayoutPageTitle('/settings/system-settings')).toBe('System Settings');
  });

  it('derives full breadcrumbs from pathnames', () => {
    expect(getAppLayoutBreadcrumbItems('/')).toEqual([
      { label: 'Dashboard', href: '/' },
    ]);
    expect(getAppLayoutBreadcrumbItems('/settings/coming-soon/billing')).toEqual([
      { label: 'Settings', href: '/settings' },
      { label: 'Coming Soon', href: '/settings/coming-soon' },
      { label: 'Billing', href: '/settings/coming-soon/billing' },
    ]);
    expect(getAppLayoutBreadcrumbItems('/applicants/550e8400-e29b-41d4-a716-446655440000/evaluate')).toEqual([
      { label: 'Applicants', href: '/applicants' },
      { label: 'Detail', href: '/applicants/550e8400-e29b-41d4-a716-446655440000' },
      { label: 'Evaluate', href: '/applicants/550e8400-e29b-41d4-a716-446655440000/evaluate' },
    ]);
  });
});
