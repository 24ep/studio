"use client";

import { useCallback, useRef, useState } from 'react';
import type { Session } from 'next-auth';
import type { Applicant, Position, UserProfile } from '@/lib/types';
import {
  buildDashboardClientResponseState,
} from './dashboard-client-data-utils';
import {
  DEFAULT_DASHBOARD_METRICS,
  type DashboardMetrics,
} from './dashboard-client-data-types';
import { fetchDashboardClientResponses } from './dashboard-client-data-fetch';
import {
  applyDashboardClientResponseState,
  clearDashboardClientListsAfterFetchError,
} from './dashboard-client-state-appliers';
import { useDashboardHeadcountData } from './use-dashboard-headcount-data';
import {
  useDashboardInitialClientFetch,
  useDashboardInitialDataSync,
} from './use-dashboard-client-sync-effects';
import { useDashboardStageNames } from './use-dashboard-stage-names';

export type { DashboardMetrics } from './dashboard-client-data-types';

interface UseDashboardClientDataInput {
  initialApplicants: Applicant[];
  initialPositions: Position[];
  initialUsers: UserProfile[];
  initialMetrics?: DashboardMetrics;
  initialFetchError?: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
  initialStageNames: Record<string, string>;
  status: string;
  sessionUser?: Session['user'] | null;
}

export function useDashboardClientData({
  initialApplicants,
  initialPositions,
  initialUsers,
  initialMetrics,
  initialFetchError,
  serverAuthError,
  serverPermissionError,
  initialStageNames,
  status,
  sessionUser,
}: UseDashboardClientDataInput) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics || DEFAULT_DASHBOARD_METRICS);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>(initialApplicants || []);
  const [myAssignedApplicants, setMyAssignedApplicants] = useState<Applicant[]>(initialApplicants || []);
  const [allPositions, setAllPositions] = useState<Position[]>(initialPositions || []);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(initialUsers || []);
  const [myBacklogApplicants, setMyBacklogApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError || null);
  const [authError, setAuthError] = useState(serverAuthError);
  const [permissionError, setPermissionError] = useState(serverPermissionError);
  const hasFetchedClientDataRef = useRef(false);

  const stageNames = useDashboardStageNames({
    applicants: filteredApplicants,
    initialStageNames,
  });
  const {
    headcountData,
    headcountLoading,
  } = useDashboardHeadcountData({
    allPositionsCount: allPositions.length,
    sessionUser,
    status,
  });

  const fetchDataClientSide = useCallback(async () => {
    if (status !== 'authenticated' || !sessionUser?.id) {
      setIsLoading(false);
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    const userId = sessionUser.id;

    try {
      const {
        applicantsRes,
        canViewAllApplicants,
        canViewAllUsers,
        metricsRes,
        positionsRes,
        usersRes,
      } = await fetchDashboardClientResponses({ sessionUser, userId });
      const nextState = buildDashboardClientResponseState({
        applicantsRes,
        canViewAllApplicants,
        canViewAllUsers,
        metricsRes,
        positionsRes,
        stageNames,
        usersRes,
      });
      applyDashboardClientResponseState(nextState, {
        setAllPositions,
        setAllUsers,
        setFetchError,
        setFilteredApplicants,
        setMetrics,
        setMyAssignedApplicants,
        setMyBacklogApplicants,
      });
    } catch (error) {
      const genericMessage = (error as Error).message || 'An unexpected error occurred.';
      setFetchError(genericMessage);
      clearDashboardClientListsAfterFetchError({
        setAllPositions,
        setAllUsers,
        setFetchError,
        setFilteredApplicants,
        setMetrics,
        setMyAssignedApplicants,
        setMyBacklogApplicants,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionUser, stageNames, status]);

  useDashboardInitialDataSync({
    initialApplicants,
    initialFetchError,
    initialPositions,
    initialUsers,
    serverAuthError,
    serverPermissionError,
    sessionUser,
    setAllPositions,
    setAllUsers,
    setAuthError,
    setFetchError,
    setFilteredApplicants,
    setMyAssignedApplicants,
    setMyBacklogApplicants,
    setPermissionError,
    stageNames,
    status,
  });

  useDashboardInitialClientFetch({
    fetchDataClientSide,
    hasFetchedClientDataRef,
    initialApplicants,
    initialPositions,
    sessionUserId: sessionUser?.id,
    status,
  });

  return {
    allPositions,
    allUsers,
    authError,
    fetchDataClientSide,
    fetchError,
    filteredApplicants,
    headcountData,
    headcountLoading,
    isLoading,
    metrics,
    myAssignedApplicants,
    myBacklogApplicants,
    permissionError,
    stageNames,
  };
}
