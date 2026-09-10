import { describe, expect, it } from 'vitest';
import {
  buildFilteredSidebarGroups,
  buildSidebarMenuSections,
  buildSplitSidebarGroups,
  formatProcessQueueBadgeCount,
  getActiveSidebarGroup,
  getDisplayedSidebarGroupLabel,
  getInitialSidebarActiveGroupLabel,
  getSidebarGroupFirstHref,
  getSidebarSectionClassName,
  isSidebarItemActive,
  shouldShowAssignedPositionsSection,
  shouldShowProcessQueueBadge,
  shouldShowSidebarMenuPanel,
  shouldShowSidebarSectionLabel,
} from './safe-sidebar-nav-utils';
import { sidebarConfigData } from './SidebarNavConfig';
import type { SidebarNavGroup } from './SidebarNavConfig';

const Icon = () => null;

const groups: SidebarNavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Icon,
    items: [
      { label: 'Dashboard', icon: Icon, href: '/dashboard', permissionId: 'DASHBOARD_VIEW' },
    ],
  },
  {
    id: 'applicants',
    label: 'Applicants',
    icon: Icon,
    items: [
      { label: 'Applicants', icon: Icon, href: '/applicants', permissionId: 'applicantS_VIEW' },
    ],
  },
  {
    id: 'positions',
    label: 'Positions',
    icon: Icon,
    items: [
      { label: 'Positions', icon: Icon, href: '/positions', permissionId: 'POSITIONS_VIEW' },
    ],
  },
  {
    id: 'admin-center',
    label: 'Settings',
    icon: Icon,
    items: [
      { label: 'Users', icon: Icon, href: '/settings/users', permissionId: 'USERS_VIEW' },
    ],
  },
];

describe('safe-sidebar-nav-utils', () => {
  it('filters groups and removes empty groups', () => {
    const filteredGroups = buildFilteredSidebarGroups(
      groups,
      item => item.permissionId === 'POSITIONS_VIEW'
    );

    expect(filteredGroups).toHaveLength(1);
    expect(filteredGroups[0].label).toBe('Positions');
    expect(filteredGroups[0].items.map(item => item.href)).toEqual(['/positions']);
  });

  it('matches exact and nested sidebar item routes', () => {
    expect(isSidebarItemActive('/positions', { href: '/positions' })).toBe(true);
    expect(isSidebarItemActive('/positions/123', { href: '/positions' })).toBe(true);
    expect(isSidebarItemActive('/positions-archive', { href: '/positions' })).toBe(false);
    expect(isSidebarItemActive('/applicants?view=task-board', { href: '/applicants?view=task-board' })).toBe(true);
    expect(isSidebarItemActive('/applicants?view=task-board', { href: '/applicants' })).toBe(true);
    expect(isSidebarItemActive('/applicants', { href: '/applicants?view=task-board' })).toBe(false);
    expect(isSidebarItemActive('/ess/leave', { href: '/ess', exact: true })).toBe(false);
    expect(isSidebarItemActive('/ess', { href: '/ess', exact: true })).toBe(true);
    expect(isSidebarItemActive('/settings?adminTab=hr-setup&setupView=map', { href: '/settings', exact: true })).toBe(true);
    expect(isSidebarItemActive('/settings?adminTab=roles-permissions', { href: '/settings', exact: true })).toBe(false);
    expect(isSidebarItemActive('/settings?adminTab=roles-permissions', { href: '/settings?adminTab=roles-permissions' })).toBe(true);
    expect(isSidebarItemActive('/workforce/leave', { href: '/workforce/leave', exact: true })).toBe(true);
    expect(isSidebarItemActive('/workforce/leave/allocation', { href: '/workforce/leave', exact: true })).toBe(false);
    expect(isSidebarItemActive('/anything', { href: '/' })).toBe(false);
    expect(isSidebarItemActive('/', { href: '/' })).toBe(true);
  });

  it('derives initial active group from special paths and item matches', () => {
    expect(getInitialSidebarActiveGroupLabel('/settings', groups)).toBe('Settings');
    expect(getInitialSidebarActiveGroupLabel('/dashboard', groups)).toBe('Dashboard');
    expect(getInitialSidebarActiveGroupLabel('/positions/123', groups)).toBe('Positions');
    expect(getInitialSidebarActiveGroupLabel('/settings/rooms', groups)).toBe('Settings');
    expect(getInitialSidebarActiveGroupLabel('/unknown', groups)).toBe('Dashboard');
  });

  it('derives displayed and active groups', () => {
    expect(getDisplayedSidebarGroupLabel('Positions', 'Dashboard')).toBe('Positions');
    expect(getDisplayedSidebarGroupLabel(undefined, 'Dashboard')).toBe('Dashboard');
    expect(getActiveSidebarGroup(groups, 'Positions')?.label).toBe('Positions');
    expect(getActiveSidebarGroup(groups, 'Missing')?.label).toBe('Dashboard');
  });

  it('shows the secondary menu for split sidebar groups except the home route', () => {
    expect(shouldShowSidebarMenuPanel('/')).toBe(false);
    expect(shouldShowSidebarMenuPanel('/settings')).toBe(false);
    expect(shouldShowSidebarMenuPanel('/job-portal', 'Job Portal')).toBe(false);
    expect(shouldShowSidebarMenuPanel('/settings', 'Settings')).toBe(true);
    expect(shouldShowSidebarMenuPanel('/settings/users', 'Settings')).toBe(true);
    expect(shouldShowSidebarMenuPanel('/positions', 'Recruitment')).toBe(true);
  });

  it('preserves planned HRIS main menu groups', () => {
    const recruitmentGroup: SidebarNavGroup = {
      id: 'recruitment',
      label: 'Recruitment',
      icon: Icon,
      items: [
        { label: 'Applicants', icon: Icon, href: '/applicants', section: 'Pipeline' },
        { label: 'Positions', icon: Icon, href: '/positions', section: 'Pipeline' },
        { label: 'Interviews', icon: Icon, href: '/calendar', section: 'Selection' },
        { label: 'AI docs processing', icon: Icon, href: '/process-queue', section: 'Automation' },
      ],
    };
    const peopleGroup: SidebarNavGroup = {
      id: 'people',
      label: 'People',
      icon: Icon,
      items: [{ label: 'Directory', icon: Icon, href: '/people' }],
    };
    const essGroup: SidebarNavGroup = {
      id: 'ess',
      label: 'ESS',
      icon: Icon,
      items: [
        { label: 'Dashboard', icon: Icon, href: '/ess', section: 'Employee service' },
        { label: 'Leave', icon: Icon, href: '/ess/leave', section: 'Employee service' },
      ],
    };
    const adminGroup: SidebarNavGroup = {
      id: 'admin-center',
      label: 'Admin Center',
      icon: Icon,
      items: [{ label: 'System settings', icon: Icon, href: '/settings/system-settings' }],
    };

    const splitGroups = buildSplitSidebarGroups([
      groups[0],
      recruitmentGroup,
      essGroup,
      peopleGroup,
      adminGroup,
    ]);

    expect(splitGroups.map(group => group.label)).toEqual(['Dashboard', 'Recruitment', 'ESS', 'People', 'Admin Center']);
    expect(splitGroups[1].items.map(item => item.href)).toEqual([
      '/applicants',
      '/positions',
      '/calendar',
      '/process-queue',
    ]);
    expect(splitGroups[2].items.map(item => item.href)).toEqual(['/ess', '/ess/leave']);
    expect(splitGroups[3].items.map(item => item.href)).toEqual(['/people']);
    expect(splitGroups[4].items.map(item => item.href)).toEqual(['/settings/system-settings']);
  });

  it('keeps the real main menu aligned to the HRIS plan', () => {
    expect(sidebarConfigData.map(group => group.label)).toEqual([
      'Employee Portal',
      'Recruitment',
      'Clients',
      'People',
      'Workforce',
      'Performance',
      'Leave',
      'Data & Analytics',
      'Learning',
      'Job Portal',
      'Payroll',
      'Expenses',
      'ESS',
      'Communications',
      'Admin Center',
      'Operations Tools',
      'Privacy & Support',
    ]);
    expect(sidebarConfigData.find(group => group.label === 'Job Portal')).toMatchObject({
      label: 'Job Portal',
      items: [expect.objectContaining({
        href: '/job-portal',
        section: 'Job Portal',
      })],
    });
    expect(sidebarConfigData.at(-1)?.items.map(item => item.href)).toEqual([
      '/privacy-support/privacy-policy',
      '/privacy-support/terms',
      '/privacy-support/data-deletion',
      '/privacy-support/releases',
    ]);
    expect(sidebarConfigData.find(group => group.label === 'People')?.items.map(item => item.href)).toContain('/service-desk');
    expect(sidebarConfigData.find(group => group.label === 'People')?.items.map(item => item.href)).toContain('/people/assets');
    expect(sidebarConfigData.find(group => group.label === 'Operations Tools')?.items).toEqual([
      expect.objectContaining({ label: 'Employee Fault Detection', href: '/fault-detection' }),
    ]);
    expect(
      sidebarConfigData.find(group => group.label === 'Workforce')?.items[0],
    ).toMatchObject({
      label: 'Attendance',
      href: '/workforce/attendance?view=attendance',
      permissionId: 'HR_WORKFORCE_VIEW',
    });
    expect(
      sidebarConfigData.find(group => group.label === 'Admin Center')?.items.map(item => item.href),
    ).not.toContain('/settings/system-settings?tab=email-templates');
    expect(
      sidebarConfigData.find(group => group.label === 'Recruitment')?.items[0],
    ).toMatchObject({ label: 'Headcount Requests', href: '/hiring/headcount-requests' });
    expect(
      sidebarConfigData.find(group => group.label === 'Recruitment')?.items,
    ).toContainEqual(expect.objectContaining({
      label: 'AI Processing Queue',
      href: '/process-queue',
      permissionId: 'UPLOAD_QUEUE_VIEW',
    }));
    expect(
      sidebarConfigData.find(group => group.label === 'Data & Analytics')?.items.map(item => item.href),
    ).toEqual(['/data-operations?mode=import', '/data-operations?mode=export']);
    expect(
      sidebarConfigData.find(group => group.label === 'Admin Center')?.items[0],
    ).toMatchObject({ label: 'Overview', href: '/settings/overview' });
  });

  it('gets the first navigation href for a group', () => {
    expect(getSidebarGroupFirstHref(groups[1])).toBe('/applicants');
    expect(getSidebarGroupFirstHref(undefined)).toBeUndefined();
    expect(getSidebarGroupFirstHref({ id: 'empty', label: 'Empty', icon: Icon, items: [] })).toBeUndefined();
  });

  it('groups menu items by section while preserving section order', () => {
    const settingsGroup: SidebarNavGroup = {
      id: 'admin-center',
      label: 'Settings',
      icon: Icon,
      items: [
        { label: 'System', icon: Icon, href: '/settings/system', section: 'Platform' },
        { label: 'Prompts', icon: Icon, href: '/settings/prompts', section: 'Configuration' },
        { label: 'Branding', icon: Icon, href: '/settings/branding', section: 'Platform' },
        { label: 'Logs', icon: Icon, href: '/settings/logs' },
      ],
    };

    expect(
      buildSidebarMenuSections(settingsGroup).map(section => ({
        label: section.label,
        items: section.items.map(item => item.label),
      }))
    ).toEqual([
      { label: 'Platform', items: ['System', 'Branding'] },
      { label: 'Configuration', items: ['Prompts'] },
      { label: 'Settings', items: ['Logs'] },
    ]);
  });

  it('decides when section labels and section dividers are visible', () => {
    expect(shouldShowSidebarSectionLabel('Admin Center', 'Admin Center', 'Admin Center')).toBe(true);
    expect(shouldShowSidebarSectionLabel('Settings', 'Settings', 'Settings')).toBe(true);
    expect(shouldShowSidebarSectionLabel(undefined, 'Settings', 'Settings')).toBe(false);
    expect(shouldShowSidebarSectionLabel(undefined, 'Configuration', 'Settings')).toBe(true);
    expect(shouldShowSidebarSectionLabel('Recruitment', 'Pipeline', 'Recruitment')).toBe(true);

    expect(getSidebarSectionClassName(0)).toBeUndefined();
    expect(getSidebarSectionClassName(1)).toContain('border-t');
  });

  it('formats and gates the process queue badge', () => {
    expect(shouldShowProcessQueueBadge({ href: '/process-queue' }, null)).toBe(false);
    expect(shouldShowProcessQueueBadge({ href: '/process-queue' }, 0)).toBe(false);
    expect(shouldShowProcessQueueBadge({ href: '/process-queue' }, 5)).toBe(true);
    expect(shouldShowProcessQueueBadge({ href: '/dashboard' }, 5)).toBe(false);

    expect(formatProcessQueueBadgeCount(null)).toBeNull();
    expect(formatProcessQueueBadgeCount(0)).toBeNull();
    expect(formatProcessQueueBadgeCount(5)).toBe(5);
    expect(formatProcessQueueBadgeCount(100)).toBe('99+');
  });

  it('shows assigned positions only for positions with enabled preferences and positions', () => {
    expect(
      shouldShowAssignedPositionsSection({
        activeGroupLabel: 'Positions',
        showAssignedPositions: true,
        hasPositions: true,
      })
    ).toBe(true);
    expect(
      shouldShowAssignedPositionsSection({
        activeGroupLabel: 'Positions',
        showAssignedPositions: 'true',
        hasPositions: true,
      })
    ).toBe(true);
    expect(
      shouldShowAssignedPositionsSection({
        activeGroupLabel: 'Settings',
        showAssignedPositions: true,
        hasPositions: true,
      })
    ).toBe(false);
    expect(
      shouldShowAssignedPositionsSection({
        activeGroupLabel: 'Positions',
        showAssignedPositions: false,
        hasPositions: true,
      })
    ).toBe(false);
    expect(
      shouldShowAssignedPositionsSection({
        activeGroupLabel: 'Positions',
        showAssignedPositions: true,
        hasPositions: false,
      })
    ).toBe(false);
  });
});
