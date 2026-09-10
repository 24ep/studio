import { describe, expect, it } from 'vitest';

import { getSettingsItemKey, hasSettingsItemIcon } from './SettingsPageView';
import { SYSTEM_SETTINGS_TAB_IDS } from './system-settings/system-settings-page-constants';
import { adminCenterTabs, adminCenterTabSlugs, getAdminCenterTabFromSlug, settingsItems } from './settings-page-model';

describe('Admin Center settings model', () => {
  it('keeps the Figma category order and provides content for every tab', () => {
    expect(adminCenterTabs).toEqual([
      'HR Setup',
      'User Accounts',
      'Roles & Permissions',
      'Branding',
      'Field Management',
      'Communication',
      'AI',
      'Integrations & API',
      'Security & Governance',
      'Billing',
      'Logs & Monitoring',
    ]);

    for (const tab of adminCenterTabs) {
      expect(settingsItems.some(item => item.tab === tab)).toBe(true);
    }
  });

  it('does not expose placeholder settings destinations', () => {
    expect(settingsItems.some(item => item.value === 'Coming soon')).toBe(false);
    expect(settingsItems.some(item => item.href.startsWith('/settings/coming-soon/'))).toBe(false);
    expect(settingsItems.find(item => item.label === 'Billing Preferences')).toMatchObject({
      href: '/settings/policy-configuration?area=billing',
      tab: 'Billing',
      value: 'Configure',
    });
  });

  it('provides an icon for every configuration menu item', () => {
    expect(settingsItems.filter(item => !hasSettingsItemIcon(item.label)).map(item => item.label)).toEqual([]);
  });

  it('keeps menu selection distinct when settings share a destination', () => {
    const notificationSettings = settingsItems.find(item => item.label === 'Notification Settings');
    const emailServer = settingsItems.find(item => item.label === 'Email Server');

    expect(notificationSettings?.href).toBe(emailServer?.href);
    expect(getSettingsItemKey(notificationSettings!)).not.toBe(getSettingsItemKey(emailServer!));
  });

  it('groups PWA settings with platform feature flags', () => {
    expect(settingsItems.find(item => item.label === 'PWA Settings')).toMatchObject({
      tab: 'Security & Governance',
      section: 'Platform Governance',
    });
  });

  it('groups authentication configuration while keeping login methods separate from Azure', () => {
    expect(settingsItems.filter(item => ['Login Methods', 'Azure Integration', 'Domain Verification'].includes(item.label)))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ label: 'Login Methods', tab: 'Security & Governance', section: 'Authentication' }),
        expect.objectContaining({ label: 'Azure Integration', tab: 'Security & Governance', section: 'Authentication' }),
        expect.objectContaining({ label: 'Domain Verification', tab: 'Security & Governance', section: 'Authentication' }),
      ]));
    expect(settingsItems.find(item => item.label === 'Login Methods')).toMatchObject({
      href: '/settings/system-settings?tab=login-methods',
    });
    expect(settingsItems.find(item => item.label === 'Domain Verification')).toMatchObject({
      href: '/settings/system-settings?tab=domain-verification',
    });
  });

  it('provides stable sidebar links for every Admin Center category', () => {
    for (const tab of adminCenterTabs) {
      expect(getAdminCenterTabFromSlug(adminCenterTabSlugs[tab])).toBe(tab);
    }
    expect(getAdminCenterTabFromSlug('unknown')).toBe('HR Setup');
    expect(getAdminCenterTabFromSlug('feature-flags')).toBe('Security & Governance');
    expect(getAdminCenterTabFromSlug('security')).toBe('Security & Governance');
    expect(getAdminCenterTabFromSlug('app-api')).toBe('Integrations & API');
  });

  it('exposes workforce-related configuration in HR Setup', () => {
    expect(settingsItems.find(item => item.label === 'Holiday List')).toBeUndefined();
    expect(settingsItems.find(item => item.label === 'Holiday Calendars')).toMatchObject({ tab: 'HR Setup' });
    expect(settingsItems.find(item => item.label === 'Leave Block List')).toMatchObject({ tab: 'HR Setup' });
  });

  it('includes employee documents in HR Setup', () => {
    expect(settingsItems.find(item => item.label === 'Employee Documents')).toMatchObject({
      href: '/settings/document-templates',
      tab: 'HR Setup',
      section: 'Documents',
      permissionId: 'SYSTEM_SETTINGS_VIEW',
    });
  });

  it('keeps user accounts separate from Roles & Permissions', () => {
    const accountItems = settingsItems.filter(item => item.tab === 'User Accounts');
    const rolePermissionItems = settingsItems.filter(item => item.tab === 'Roles & Permissions');

    expect(accountItems.map(item => item.label)).toEqual(['Active Users']);
    expect(accountItems.map(item => item.section)).toEqual(['Accounts']);
    expect(rolePermissionItems.map(item => item.label)).toEqual(['Employee Account Role', 'User Teams']);
  });

  it('splits Branding setup into dedicated preference entries', () => {
    expect(settingsItems.find(item => item.label === 'Appearance')).toBeUndefined();
    expect(settingsItems.find(item => item.label === 'Evaluation Theme')).toBeUndefined();
    expect(settingsItems.find(item => item.label === 'Branding')).toBeUndefined();

    expect(settingsItems.find(item => item.label === 'Core Identity')).toMatchObject({
      href: '/settings/system-preferences?tab=branding&focus=core-identity',
      tab: 'Branding',
      section: 'Branding Setup',
    });
    expect(settingsItems.find(item => item.label === 'Header Branding')).toMatchObject({
      href: '/settings/system-preferences?tab=branding&focus=header-branding',
      tab: 'Branding',
      section: 'Branding Setup',
    });
    expect(settingsItems.find(item => item.label === 'Sign In')).toMatchObject({
      href: '/settings/system-preferences?tab=branding&focus=sign-in',
      tab: 'Branding',
      section: 'Branding Setup',
    });
    expect(settingsItems.find(item => item.label === 'Navigation')).toMatchObject({
      href: '/settings/system-preferences?tab=branding&focus=navigation',
      tab: 'Branding',
      section: 'Branding Setup',
    });
  });

  it('provides a direct Leave Policies entry in HR Setup', () => {
    expect(settingsItems.find(item => item.label === 'Leave Policies')).toMatchObject({
      href: '/settings/leave-policies',
      tab: 'HR Setup',
      section: 'Organization',
      permissionIds: ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'],
    });
  });

  it('provides a direct Leave Policy Assignments entry in HR Setup', () => {
    expect(settingsItems.find(item => item.label === 'Leave Policy Assignments')).toMatchObject({
      href: '/settings/leave-policy-assignments',
      tab: 'HR Setup',
      section: 'Leave',
      permissionIds: ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'],
    });
  });

  it('provides Policy Documents inside HR Setup', () => {
    expect(settingsItems.find(item => item.label === 'Policy Documents')).toMatchObject({
      href: '/policy-documents',
      tab: 'HR Setup',
      section: 'Documents',
    });
  });

  it('provides the onboarding checklist inside HR Setup', () => {
    expect(settingsItems.find(item => item.label === 'Onboarding Checklist')).toMatchObject({
      href: '/settings/onboarding',
      tab: 'HR Setup',
      section: 'People Configuration',
      permissionId: 'HR_PEOPLE_MANAGE',
    });
  });

  it('provides service desk category routing inside HR Setup', () => {
    expect(settingsItems.find(item => item.label === 'Service Desk Categories')).toMatchObject({
      href: '/settings/service-desk',
      tab: 'HR Setup',
      section: 'People Configuration',
      permissionId: 'SYSTEM_SETTINGS_VIEW',
    });
  });

  it('provides direct entries for every shared position configuration page', () => {
    expect(settingsItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Platform Defaults', href: '/settings/platform-defaults' }),
      expect.objectContaining({ label: 'Headcount Types', href: '/settings/headcount-types' }),
      expect.objectContaining({ label: 'Grades', href: '/settings/grades' }),
      expect.objectContaining({ label: 'Position Levels', href: '/settings/position-levels' }),
    ]));
  });

  it('groups audit controls with logs and monitoring', () => {
    expect(settingsItems.filter(item => item.tab === 'Logs & Monitoring')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Application Logs', section: 'System Logs' }),
        expect.objectContaining({ label: 'System Monitoring', section: 'Monitoring' }),
        expect.objectContaining({ label: 'System Status', href: '/system-status', section: 'Monitoring' }),
        expect.objectContaining({ label: 'Audit & Controls', href: '/audit-controls', section: 'Audit & Governance' }),
      ]),
    );
  });

  it('provides canonical cost center and project administration', () => {
    expect(settingsItems.find(item => item.label === 'Cost Centers & Projects')).toMatchObject({
      href: '/settings/projects',
      tab: 'HR Setup',
      section: 'Organization',
      permissionId: 'SYSTEM_SETTINGS_VIEW',
    });
  });

  it('exposes every system configuration as an Admin Center item', () => {
    const configuredTabs = settingsItems
      .filter(item => item.href.startsWith('/settings/system-settings?'))
      .map(item => new URL(item.href, 'https://admin.local').searchParams.get('tab'));

    expect(new Set(configuredTabs)).toEqual(new Set(SYSTEM_SETTINGS_TAB_IDS));
  });

});
