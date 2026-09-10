import { describe, expect, it } from 'vitest';

import {
  appendHealthProbe,
  buildAdminCenterItemHref,
  filterAdminCenterOverviewItems,
  formatServerUptime,
  getAdminHealthState,
  getUniqueSettingsItems,
  toQueueCount,
} from './admin-center-overview-model';
import type { SettingsPageItem } from './settings-page-model';

const companyInfo: SettingsPageItem = {
  href: '/settings/system-settings?tab=organize',
  label: 'Company Info',
  description: 'Legal details and contacts.',
  tab: 'HR Setup',
  section: 'Organization',
};

describe('Admin Center overview model', () => {
  it('derives the overall platform state from live application and database checks', () => {
    expect(getAdminHealthState({ loading: true })).toBe('checking');
    expect(getAdminHealthState({ loading: false, apiHealthy: true, databaseHealthy: true })).toBe('operational');
    expect(getAdminHealthState({ loading: false, apiHealthy: true, databaseHealthy: false })).toBe('degraded');
    expect(getAdminHealthState({ loading: false, apiHealthy: false, databaseHealthy: true })).toBe('unavailable');
  });

  it('keeps a bounded sequence of genuine health probes', () => {
    expect(appendHealthProbe(
      [{ checkedAt: 1, latencyMs: 40 }, { checkedAt: 2, latencyMs: 45 }],
      { checkedAt: 3, latencyMs: 50 },
      2,
    )).toEqual([{ checkedAt: 2, latencyMs: 45 }, { checkedAt: 3, latencyMs: 50 }]);
  });

  it('formats runtime and database queue values for operations metrics', () => {
    expect(formatServerUptime(90061)).toBe('1d 1h');
    expect(formatServerUptime(3660)).toBe('1h 1m');
    expect(toQueueCount('7')).toBe(7);
    expect(toQueueCount(undefined)).toBe(0);
  });

  it('routes system and embedded configuration items through the existing Admin Center workspace', () => {
    expect(buildAdminCenterItemHref(companyInfo)).toBe('/settings?systemTab=organize');
    expect(buildAdminCenterItemHref({
      ...companyInfo,
      href: '/settings/branches',
      label: 'Branch',
    })).toBe('/settings?adminTab=hr-setup&config=branches');
    expect(buildAdminCenterItemHref({
      ...companyInfo,
      href: '/settings/policy-configuration?area=people-lifecycle',
      label: 'Employee Lifecycle Policies',
      tab: 'HR Setup',
    })).toBe('/settings?adminTab=hr-setup&config=policy-configuration&configArea=people-lifecycle');
  });

  it('keeps destinations outside the settings workspace unchanged', () => {
    expect(buildAdminCenterItemHref({
      ...companyInfo,
      href: '/people/department',
      label: 'Department',
    })).toBe('/people/department');
  });

  it('deduplicates repeated configuration destinations and labels', () => {
    expect(getUniqueSettingsItems([companyInfo, companyInfo])).toEqual([companyInfo]);
  });

  it('searches labels, descriptions, sections, and Admin Center areas', () => {
    const securityItem: SettingsPageItem = {
      href: '/settings/system-settings?tab=security',
      label: 'Security Controls',
      description: 'Session and password policies.',
      tab: 'Security & Governance',
      section: 'Security',
    };

    expect(filterAdminCenterOverviewItems([companyInfo, securityItem], 'password')).toEqual([securityItem]);
    expect(filterAdminCenterOverviewItems([companyInfo, securityItem], 'organization')).toEqual([companyInfo]);
    expect(filterAdminCenterOverviewItems([companyInfo, securityItem], 'security')).toEqual([securityItem]);
  });
});
