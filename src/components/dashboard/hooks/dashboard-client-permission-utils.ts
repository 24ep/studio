import type { Session } from 'next-auth';

import { hasPermission } from '@/lib/permissions';

export function canDashboardViewAllUsers(sessionUser?: Session['user'] | null) {
  return hasPermission(sessionUser, 'USERS_VIEW') ||
    hasPermission(sessionUser, 'USERS_CREATE') ||
    hasPermission(sessionUser, 'USERS_EDIT') ||
    hasPermission(sessionUser, 'USERS_DELETE') ||
    hasPermission(sessionUser, 'USERS_PERMISSIONS_MANAGE');
}

export function canDashboardViewAllApplicants(sessionUser?: Session['user'] | null) {
  return hasPermission(sessionUser, 'applicantS_VIEW');
}
