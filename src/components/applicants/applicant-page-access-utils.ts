import { permissionMatches } from '../../lib/permission-aliases';

export interface ApplicantPagePermissions {
  canExportApplicants: boolean;
  canCreateApplicants: boolean;
  canEditApplicants: boolean;
  canDeleteApplicants: boolean;
  canChangeStatus: boolean;
  canBulkChangeStatus: boolean;
  canViewDetailed: boolean;
  canAssignSource: boolean;
  canAssignRecruiter: boolean;
}

export interface ApplicantInitialLoadingStateInput {
  sessionStatus: string;
  initialApplicantsCount: number;
  filteredApplicantsCount: number;
  hasInitialFetchError: boolean;
  serverAuthError: boolean;
  serverPermissionError: boolean;
}

export interface ApplicantInitialLoadingState {
  isLoading: boolean;
  shouldClearTableLoading: boolean;
  shouldFetchReferenceData: boolean;
}

export type ApplicantInitialFetchAction = 'fetch-client-data' | 'use-initial-data' | 'skip';

export function buildApplicantPagePermissions(modulePermissions?: unknown): ApplicantPagePermissions {
  const permissions = Array.isArray(modulePermissions) ? modulePermissions : [];

  return {
    canExportApplicants: permissionMatches(permissions, 'applicantS_EXPORT'),
    canCreateApplicants: permissionMatches(permissions, 'applicantS_CREATE'),
    canEditApplicants: (
      permissionMatches(permissions, 'applicantS_EDIT_BASIC') ||
      permissionMatches(permissions, 'applicantS_EDIT_BASIC_OWN') ||
      permissionMatches(permissions, 'applicantS_EDIT_BASIC_ALL')
    ),
    canDeleteApplicants: permissionMatches(permissions, 'applicantS_DELETE'),
    canChangeStatus: (
      permissionMatches(permissions, 'applicantS_PIPELINE_STAGE_UPDATE') ||
      permissionMatches(permissions, 'applicantS_PIPELINE_STAGE_UPDATE_OWN') ||
      permissionMatches(permissions, 'applicantS_PIPELINE_STAGE_UPDATE_ALL')
    ),
    canBulkChangeStatus: (
      permissionMatches(permissions, 'applicantS_PIPELINE_STAGE_BULK_UPDATE') ||
      permissionMatches(permissions, 'applicantS_PIPELINE_STAGE_UPDATE_OWN') ||
      permissionMatches(permissions, 'applicantS_PIPELINE_STAGE_UPDATE_ALL')
    ),
    canViewDetailed: permissionMatches(permissions, 'applicantS_VIEW_DETAILED'),
    canAssignSource: permissionMatches(permissions, 'applicantS_SOURCE_ASSIGN'),
    canAssignRecruiter: (
      permissionMatches(permissions, 'applicantS_RECRUITER_ASSIGN') ||
      permissionMatches(permissions, 'applicantS_RECRUITER_ASSIGN_OWN') ||
      permissionMatches(permissions, 'applicantS_RECRUITER_ASSIGN_ALL')
    ),
  };
}

export function getApplicantInitialLoadingState({
  sessionStatus,
  initialApplicantsCount,
  filteredApplicantsCount,
  hasInitialFetchError,
  serverAuthError,
  serverPermissionError,
}: ApplicantInitialLoadingStateInput): ApplicantInitialLoadingState {
  if (sessionStatus === 'loading') {
    return {
      isLoading: true,
      shouldClearTableLoading: false,
      shouldFetchReferenceData: false,
    };
  }

  if (sessionStatus !== 'authenticated') {
    return {
      isLoading: false,
      shouldClearTableLoading: true,
      shouldFetchReferenceData: false,
    };
  }

  const hasInitialApplicants = initialApplicantsCount > 0;
  const hasBlockingInitialError = hasInitialFetchError || serverAuthError || serverPermissionError;

  return {
    isLoading: !hasInitialApplicants && !hasBlockingInitialError && filteredApplicantsCount === 0,
    shouldClearTableLoading: false,
    shouldFetchReferenceData: true,
  };
}

export function getApplicantInitialFetchAction({
  sessionStatus,
  serverAuthError,
  serverPermissionError,
  hasInitialDataFetch,
  initialApplicantsCount,
  settingsLoading,
}: {
  sessionStatus: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
  hasInitialDataFetch: boolean;
  initialApplicantsCount: number;
  settingsLoading: boolean;
}): ApplicantInitialFetchAction {
  if (hasInitialDataFetch) {
    return 'skip';
  }

  if (initialApplicantsCount > 0) {
    return 'use-initial-data';
  }

  if (
    sessionStatus === 'authenticated' &&
    !serverAuthError &&
    !serverPermissionError &&
    !settingsLoading
  ) {
    return 'fetch-client-data';
  }

  return 'skip';
}

export function shouldStartApplicantRealtimeRefresh({
  realtimeConnected,
  sessionStatus,
  hasInitialDataFetch,
}: {
  realtimeConnected: boolean;
  sessionStatus: string;
  hasInitialDataFetch: boolean;
}) {
  return realtimeConnected && sessionStatus === 'authenticated' && hasInitialDataFetch;
}

export function shouldRefreshApplicantFitScoreCountsOnMount({
  sessionStatus,
  hasInitialDataFetch,
  initialApplicantsCount,
  hasFilters,
}: {
  sessionStatus: string;
  hasInitialDataFetch: boolean;
  initialApplicantsCount: number;
  hasFilters: boolean;
}) {
  return sessionStatus === 'authenticated' &&
    hasInitialDataFetch &&
    initialApplicantsCount > 0 &&
    hasFilters;
}
