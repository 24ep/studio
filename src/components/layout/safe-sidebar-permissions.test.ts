import { describe, expect, it } from 'vitest';

import type { SidebarNavItem } from './SidebarNavConfig';
import { hasSidebarItemPermission } from './safe-sidebar-permissions';

const Icon = () => null;
const employee = { id: 'employee-1', role: 'Employee' };

function item(href: string, adminOnly = false): SidebarNavItem {
  return { label: href, href, icon: Icon, adminOnly };
}

describe('hasSidebarItemPermission', () => {
  it('uses configurable permissions for Employee navigation items', () => {
    const referralItem = {
      ...item('/friend-referrals'),
      permissionId: 'FRIEND_REFERRALS_ACCESS',
    } as SidebarNavItem;

    expect(hasSidebarItemPermission(referralItem, false, [], employee)).toBe(false);
    expect(hasSidebarItemPermission(
      referralItem,
      false,
      ['FRIEND_REFERRALS_ACCESS'],
      { ...employee, modulePermissions: ['FRIEND_REFERRALS_ACCESS'] },
    )).toBe(true);
  });

  it('shows employee-facing Privacy & Support pages to employees', () => {
    expect(hasSidebarItemPermission(
      item('/privacy-support/data-deletion'),
      false,
      [],
      employee,
    )).toBe(true);

    expect(hasSidebarItemPermission(
      item('/service-desk'),
      false,
      [],
      employee,
    )).toBe(true);
  });

  it('supports any-of permissions for pinned task navigation', () => {
    const taskItem = {
      ...item('/my-tasks'),
      permissionIds: ['TASK_BOARD_VIEW', 'TASK_BOARD_MANAGE_OWN'],
    } as SidebarNavItem;

    expect(hasSidebarItemPermission(taskItem, false, [], employee)).toBe(false);
    expect(hasSidebarItemPermission(
      taskItem,
      false,
      ['TASK_BOARD_MANAGE_OWN'],
      { ...employee, modulePermissions: ['TASK_BOARD_MANAGE_OWN'] },
    )).toBe(true);
  });

});
