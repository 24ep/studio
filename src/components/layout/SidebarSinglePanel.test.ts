import { describe, expect, it } from 'vitest';

import { sidebarConfig } from './SidebarNavConfig';
import { buildFigmaSidebarSections, isFigmaSidebarItemActive } from './SidebarSinglePanel';

describe('buildFigmaSidebarSections', () => {
  it('activates only the selected Admin Center submenu', () => {
    const adminItems = sidebarConfig
      .find(group => group.label === 'Admin Center')
      ?.items ?? [];
    const hrSetup = adminItems.find(item => item.label === 'HR Setup');
    const fieldManagement = adminItems.find(item => item.label === 'Field Management');

    expect(hrSetup).toBeDefined();
    expect(fieldManagement).toBeDefined();
    expect(isFigmaSidebarItemActive('/settings', hrSetup!)).toBe(true);
    expect(isFigmaSidebarItemActive('/settings?adminTab=field-management', hrSetup!)).toBe(false);
    expect(isFigmaSidebarItemActive('/settings?adminTab=field-management', fieldManagement!)).toBe(true);
  });

  it('keeps the Admin Center overview distinct from the existing HR Setup page', () => {
    const adminItems = sidebarConfig
      .find(group => group.label === 'Admin Center')
      ?.items ?? [];
    const overview = adminItems.find(item => item.label === 'Overview');
    const hrSetup = adminItems.find(item => item.label === 'HR Setup');

    expect(overview).toBeDefined();
    expect(hrSetup).toBeDefined();
    expect(isFigmaSidebarItemActive('/settings/overview', overview!)).toBe(true);
    expect(isFigmaSidebarItemActive('/settings/overview', hrSetup!)).toBe(false);
    expect(isFigmaSidebarItemActive('/settings', overview!)).toBe(false);
    expect(isFigmaSidebarItemActive('/settings', hrSetup!)).toBe(true);
  });

  it('routes legacy Security and API links to their dedicated workspaces', () => {
    const adminItems = sidebarConfig
      .find(group => group.label === 'Admin Center')
      ?.items ?? [];
    const security = adminItems.find(item => item.label === 'Security & Governance');
    const integrations = adminItems.find(item => item.label === 'Integrations & API');

    expect(security).toBeDefined();
    expect(integrations).toBeDefined();
    expect(isFigmaSidebarItemActive('/settings?adminTab=feature-flags', security!)).toBe(true);
    expect(isFigmaSidebarItemActive('/settings?adminTab=security', security!)).toBe(true);
    expect(isFigmaSidebarItemActive('/settings?adminTab=app-api', integrations!)).toBe(true);
  });

  it('keeps an Admin Center tab active while a configuration item is selected', () => {
    const unified = sidebarConfig
      .find(group => group.label === 'Admin Center')
      ?.items.find(item => item.label === 'Audit, Logs & Monitoring');

    expect(unified).toBeDefined();
    expect(isFigmaSidebarItemActive(
      '/settings?adminTab=logs-monitoring&config=audit-controls',
      unified!,
    )).toBe(true);
  });

  it('renders Admin Portal, HR Dashboard, Employee Portal, and My Workday as standalone items at the top', () => {
    const sections = buildFigmaSidebarSections(sidebarConfig);

    expect(sections[0]).toMatchObject({
      label: 'Main',
      entries: [
        { type: 'leaf', label: 'Admin Portal', item: { href: '/dashboard' } },
        { type: 'leaf', label: 'HR Dashboard', item: { href: '/hr-dashboard' } },
        { type: 'leaf', label: 'Employee Portal', item: { href: '/employee-portal' } },
        { type: 'leaf', label: 'My Workday', item: { href: '/my-workday' } },
      ],
    });
    expect(sections[0].entries).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'My Tasks' }),
    ]));
  });

  it('renders Client List as a standalone item instead of a Client group', () => {
    const entries = buildFigmaSidebarSections(sidebarConfig).flatMap(section => section.entries);

    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'leaf',
        label: 'Client List',
        item: expect.objectContaining({ href: '/clients' }),
      }),
    ]));
    expect(entries).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'group', label: 'Clients' }),
    ]));
  });

  it('renders every permitted central-config item exactly once', () => {
    const renderedHrefs = buildFigmaSidebarSections(sidebarConfig)
      .flatMap(section => section.entries)
      .flatMap(entry => entry.type === 'group'
        ? entry.children.map(child => child.item.href)
        : [entry.item.href]);
    const configuredHrefs = sidebarConfig.flatMap(group => group.items.map(item => item.href));

    expect([...renderedHrefs].sort()).toEqual([...configuredHrefs].sort());
    expect(new Set(renderedHrefs).size).toBe(renderedHrefs.length);
  });

  it('surfaces configuration categories as Admin Center submenu items', () => {
    const adminCenter = buildFigmaSidebarSections(sidebarConfig)
      .flatMap(section => section.entries)
      .find(entry => entry.type === 'group' && entry.label === 'Admin Center');

    expect(adminCenter).toMatchObject({
      type: 'group',
      children: expect.arrayContaining([
        expect.objectContaining({ label: 'Overview', item: expect.objectContaining({ href: '/settings/overview' }) }),
        expect.objectContaining({ label: 'HR Setup', item: expect.objectContaining({ href: '/settings' }) }),
        expect.objectContaining({ label: 'User Accounts', item: expect.objectContaining({ href: '/settings?adminTab=user-accounts' }) }),
        expect.objectContaining({ label: 'Roles & Permissions', item: expect.objectContaining({ href: '/settings?adminTab=roles-permissions' }) }),
        expect.objectContaining({ label: 'Preferences', item: expect.objectContaining({ href: '/settings?adminTab=branding' }) }),
        expect.objectContaining({ label: 'Field Management', item: expect.objectContaining({ href: '/settings?adminTab=field-management' }) }),
        expect.objectContaining({ label: 'Communication', item: expect.objectContaining({ href: '/settings?adminTab=communication' }) }),
        expect.objectContaining({ label: 'AI', item: expect.objectContaining({ href: '/settings?adminTab=ai' }) }),
        expect.objectContaining({ label: 'Integrations & API', item: expect.objectContaining({ href: '/settings?adminTab=integrations-api' }) }),
        expect.objectContaining({ label: 'Security & Governance', item: expect.objectContaining({ href: '/settings?adminTab=security-governance' }) }),
        expect.objectContaining({ label: 'Billing', item: expect.objectContaining({ href: '/settings?adminTab=billing' }) }),
        expect.objectContaining({ label: 'Audit, Logs & Monitoring', item: expect.objectContaining({ href: '/settings?adminTab=logs-monitoring' }) }),
      ]),
    });
    if (adminCenter?.type === 'group') {
      expect(adminCenter.children.map(child => child.label)).not.toContain('Configuration');
      expect(adminCenter.children.map(child => child.label)).not.toContain('People Lifecycle');
      expect(adminCenter.children.map(child => child.label)).not.toContain('Workforce');
      expect(adminCenter.children.map(child => child.label)).not.toContain('Payroll & Expenses');
      expect(adminCenter.children.map(child => child.label)).not.toContain('Performance & Learning');
      expect(adminCenter.children.map(child => child.label)).not.toContain('Feature Flags');
      expect(adminCenter.children.map(child => child.label)).not.toContain('System Status');
    }
  });

  it('surfaces Privacy & Support features and actions in the visible sidebar', () => {
    const sections = buildFigmaSidebarSections(sidebarConfig);
    const privacySupport = sections
      .flatMap(section => section.entries)
      .find(entry => entry.type === 'group' && entry.label === 'Privacy & Support');

    expect(privacySupport).toMatchObject({
      type: 'group',
      children: expect.arrayContaining([
        expect.objectContaining({ label: 'Data Deletion Request' }),
      ]),
    });

    const employeeGroup = sections
      .find(section => section.label === 'Workforce')
      ?.entries.find(entry => entry.type === 'group' && entry.label === 'Employee');
    const serviceDesk = employeeGroup?.type === 'group'
      ? employeeGroup.children.find(child => child.label === 'Service Desk')
      : undefined;
    expect(serviceDesk).toMatchObject({
      label: 'Service Desk',
      item: expect.objectContaining({ href: '/service-desk' }),
    });
  });
});
