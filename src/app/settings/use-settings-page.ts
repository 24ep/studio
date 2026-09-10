"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import { checkPermission, isAdminUser } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';

import { settingsItems, type SettingsPageItem } from './settings-page-model';

type SettingsPageSessionUser = {
  role?: string | null;
  modulePermissions?: PlatformModuleId[] | null;
};

export function useSettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const accessibleItems = useMemo(() => {
    if (!isClient || !Array.isArray(settingsItems)) {
      return [];
    }

    return settingsItems.filter((item) => {
      try {
        return canAccessSettingsItem({
          item,
          isClient,
          sessionStatus,
          user: session?.user as SettingsPageSessionUser | undefined,
        });
      } catch (error) {
        console.warn('Settings page: Error filtering settings item:', error, item);
        return false;
      }
    });
  }, [isClient, session?.user, sessionStatus]);

  return {
    accessibleItems,
    isLoading: sessionStatus === 'loading' || !isClient,
  };
}

function canAccessSettingsItem({
  item,
  isClient,
  sessionStatus,
  user,
}: {
  item: SettingsPageItem;
  isClient: boolean;
  sessionStatus: string;
  user?: SettingsPageSessionUser;
}) {
  if (item.hidden) {
    return false;
  }

  if (!isClient || sessionStatus !== 'authenticated' || !user) {
    return false;
  }

  const userRole = user.role || 'Recruiter';
  const modulePermissions = Array.isArray(user.modulePermissions)
    ? user.modulePermissions
    : [];
  const isAdmin = isAdminUser({ role: userRole });

  if (item.adminOnly) {
    return isAdmin;
  }

  if (item.adminOnlyOrPermission) {
    return Boolean(
      isAdmin ||
      (item.permissionId && checkPermission(userRole, modulePermissions, item.permissionId)) ||
      item.permissionIds?.some(permission => checkPermission(userRole, modulePermissions, permission))
    );
  }

  if (item.permissionIds) {
    return item.permissionIds.some(permission => checkPermission(userRole, modulePermissions, permission));
  }

  if (item.permissionId) {
    return checkPermission(userRole, modulePermissions, item.permissionId);
  }

  return true;
}
