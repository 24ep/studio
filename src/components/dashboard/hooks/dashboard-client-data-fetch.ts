import type { Session } from 'next-auth';

import { safeAll, safeFetch, type SafeFetchResult } from '@/lib/safe-fetch';
import { buildDashboardApplicantsUrl } from './dashboard-client-data-utils';
import {
  canDashboardViewAllApplicants,
  canDashboardViewAllUsers,
} from './dashboard-client-permission-utils';

const DASHBOARD_FETCH_OPTIONS = {
  credentials: 'include' as const,
  timeoutMs: 10000,
};

const noPermissionResult: SafeFetchResult<unknown> = {
  ok: false,
  status: null,
  data: null,
  error: 'No permission',
};

interface FetchDashboardClientResponsesInput {
  sessionUser: Session['user'];
  userId: string;
}

export async function fetchDashboardClientResponses({
  sessionUser,
  userId,
}: FetchDashboardClientResponsesInput) {
  const canViewAllApplicants = canDashboardViewAllApplicants(sessionUser);
  const canViewAllUsers = canDashboardViewAllUsers(sessionUser);
  const userRequest = canViewAllUsers
    ? safeFetch('/api/users', DASHBOARD_FETCH_OPTIONS)
    : Promise.resolve(noPermissionResult);

  const [
    applicantsRes,
    usersRes,
    positionsRes,
    metricsRes,
  ] = await safeAll([
    safeFetch(buildDashboardApplicantsUrl({ canViewAllApplicants, userId }), DASHBOARD_FETCH_OPTIONS),
    userRequest,
    safeFetch('/api/positions', DASHBOARD_FETCH_OPTIONS),
    safeFetch('/api/dashboard/metrics', DASHBOARD_FETCH_OPTIONS),
  ]);

  return {
    applicantsRes,
    canViewAllApplicants,
    canViewAllUsers,
    metricsRes,
    positionsRes,
    usersRes,
  };
}
