import type { SafeFetchResult } from '@/lib/safe-fetch';
import {
  ACTIVE_APPLICANT_STATUSES,
  type Applicant,
  type CoreApplicantStatus,
  type Position,
  type UserProfile,
} from '../../../lib/types';
import type { DashboardMetrics } from './dashboard-client-data-types';

export function getApiList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }

  return [];
}

export function getDashboardBacklogApplicants(
  applicants: Applicant[],
  stageNames: Record<string, string>
) {
  return applicants.filter((applicant) => {
    const statusName = applicant.statusId ? stageNames[applicant.statusId] : (applicant.status || '');
    return ACTIVE_APPLICANT_STATUSES.includes(statusName as CoreApplicantStatus);
  });
}

export function buildDashboardApplicantsUrl({
  canViewAllApplicants,
  userId,
}: {
  canViewAllApplicants: boolean;
  userId: string;
}) {
  return canViewAllApplicants
    ? '/api/applicants?limit=200'
    : `/api/applicants?recruiterId=${userId}&limit=200`;
}

interface DashboardClientResponseInput {
  applicantsRes: SafeFetchResult<unknown>;
  canViewAllApplicants: boolean;
  canViewAllUsers: boolean;
  metricsRes: SafeFetchResult<unknown>;
  positionsRes: SafeFetchResult<unknown>;
  stageNames: Record<string, string>;
  usersRes: SafeFetchResult<unknown>;
}

interface DashboardClientResponseWarning {
  endpoint: string;
  message: string | number | null;
}

export interface DashboardClientResponseState {
  fetchError: string | null;
  nextAllPositions?: Position[];
  nextAllUsers?: UserProfile[];
  nextFilteredApplicants?: Applicant[];
  nextMetrics?: DashboardMetrics;
  nextMyAssignedApplicants?: Applicant[];
  nextMyBacklogApplicants?: Applicant[];
  warnings: DashboardClientResponseWarning[];
}

export function buildDashboardClientResponseState({
  applicantsRes,
  canViewAllApplicants,
  canViewAllUsers,
  metricsRes,
  positionsRes,
  stageNames,
  usersRes,
}: DashboardClientResponseInput): DashboardClientResponseState {
  const nextState: DashboardClientResponseState = {
    fetchError: null,
    warnings: [],
  };
  const fetchErrors: string[] = [];

  if (!applicantsRes.ok) {
    nextState.warnings.push({
      endpoint: '/api/applicants',
      message: applicantsRes.error || applicantsRes.status,
    });
    fetchErrors.push(`Failed to fetch Applicants: ${applicantsRes.error}.`);

    if (canViewAllApplicants) {
      nextState.nextFilteredApplicants = [];
    } else {
      nextState.nextMyAssignedApplicants = [];
    }
  } else if (applicantsRes.data) {
    const applicantsData = getApiList<Applicant>(applicantsRes.data);
    const backlogData = getDashboardBacklogApplicants(applicantsData, stageNames);

    if (canViewAllApplicants) {
      nextState.nextFilteredApplicants = applicantsData;
      nextState.nextMyAssignedApplicants = applicantsData;
      nextState.nextMyBacklogApplicants = backlogData;
    } else {
      nextState.nextMyAssignedApplicants = applicantsData;
      nextState.nextMyBacklogApplicants = backlogData;
    }
  }

  if (!usersRes.ok) {
    if (canViewAllUsers) {
      nextState.warnings.push({
        endpoint: '/api/users',
        message: usersRes.error || usersRes.status,
      });
      fetchErrors.push(`Failed to fetch users: ${usersRes.error}.`);
    }
    nextState.nextAllUsers = [];
  } else if (usersRes.data) {
    nextState.nextAllUsers = Array.isArray(usersRes.data)
      ? (usersRes.data as UserProfile[])
      : [];
  }

  if (!positionsRes.ok) {
    nextState.warnings.push({
      endpoint: '/api/positions',
      message: positionsRes.error || positionsRes.status,
    });
    fetchErrors.push(`Failed to fetch positions: ${positionsRes.error}.`);
    nextState.nextAllPositions = [];
  } else if (positionsRes.data) {
    nextState.nextAllPositions = getApiList<Position>(positionsRes.data);
  }

  if (metricsRes.ok && metricsRes.data) {
    nextState.nextMetrics = metricsRes.data as DashboardMetrics;
  } else if (!metricsRes.ok) {
    nextState.warnings.push({
      endpoint: '/api/dashboard/metrics',
      message: metricsRes.error,
    });
  }

  nextState.fetchError = fetchErrors.length > 0 ? fetchErrors.join(' ') : null;
  return nextState;
}
