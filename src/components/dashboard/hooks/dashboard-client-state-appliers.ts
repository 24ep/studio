import type { Dispatch, SetStateAction } from 'react';

import type { Applicant, Position, UserProfile } from '@/lib/types';
import type { DashboardClientResponseState } from './dashboard-client-data-utils';
import type { DashboardMetrics } from './dashboard-client-data-types';

interface DashboardClientStateSetters {
  setAllPositions: Dispatch<SetStateAction<Position[]>>;
  setAllUsers: Dispatch<SetStateAction<UserProfile[]>>;
  setFetchError: Dispatch<SetStateAction<string | null>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setMetrics: Dispatch<SetStateAction<DashboardMetrics>>;
  setMyAssignedApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setMyBacklogApplicants: Dispatch<SetStateAction<Applicant[]>>;
}

export function applyDashboardClientResponseState(
  nextState: DashboardClientResponseState,
  {
    setAllPositions,
    setAllUsers,
    setFetchError,
    setFilteredApplicants,
    setMetrics,
    setMyAssignedApplicants,
    setMyBacklogApplicants,
  }: DashboardClientStateSetters,
) {
  nextState.warnings.forEach(({ endpoint, message }) => {
    console.warn(`Skipping failed endpoint ${endpoint}:`, message);
  });

  if (nextState.nextFilteredApplicants) {
    setFilteredApplicants(nextState.nextFilteredApplicants);
  }
  if (nextState.nextMyAssignedApplicants) {
    setMyAssignedApplicants(nextState.nextMyAssignedApplicants);
  }
  if (nextState.nextMyBacklogApplicants) {
    setMyBacklogApplicants(nextState.nextMyBacklogApplicants);
  }
  if (nextState.nextAllUsers) {
    setAllUsers(nextState.nextAllUsers);
  }
  if (nextState.nextAllPositions) {
    setAllPositions(nextState.nextAllPositions);
  }
  if (nextState.nextMetrics) {
    setMetrics(nextState.nextMetrics);
  }
  if (nextState.fetchError) {
    setFetchError(nextState.fetchError);
  }
}

export function clearDashboardClientListsAfterFetchError({
  setAllPositions,
  setAllUsers,
  setFilteredApplicants,
  setMyAssignedApplicants,
  setMyBacklogApplicants,
}: DashboardClientStateSetters) {
  setFilteredApplicants([]);
  setMyAssignedApplicants([]);
  setAllPositions([]);
  setAllUsers([]);
  setMyBacklogApplicants([]);
}
