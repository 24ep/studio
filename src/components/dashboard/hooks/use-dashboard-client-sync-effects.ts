"use client";

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Session } from 'next-auth';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import type { Applicant, Position, UserProfile } from '@/lib/types';
import {
  getDashboardBacklogApplicants,
} from './dashboard-client-data-utils';
import {
  canDashboardViewAllApplicants,
} from './dashboard-client-permission-utils';

interface DashboardInitialDataSyncInput {
  initialApplicants: Applicant[];
  initialFetchError?: string;
  initialPositions: Position[];
  initialUsers: UserProfile[];
  serverAuthError: boolean;
  serverPermissionError: boolean;
  sessionUser?: Session['user'] | null;
  setAllPositions: Dispatch<SetStateAction<Position[]>>;
  setAllUsers: Dispatch<SetStateAction<UserProfile[]>>;
  setAuthError: Dispatch<SetStateAction<boolean>>;
  setFetchError: Dispatch<SetStateAction<string | null>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setMyAssignedApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setMyBacklogApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setPermissionError: Dispatch<SetStateAction<boolean>>;
  stageNames: Record<string, string>;
  status: string;
}

export function useDashboardInitialDataSync({
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
}: DashboardInitialDataSyncInput) {
  useEffect(() => {
    setFilteredApplicants(initialApplicants || []);

    if (!canDashboardViewAllApplicants(sessionUser)) {
      setMyAssignedApplicants(initialApplicants || []);
      setMyBacklogApplicants(getDashboardBacklogApplicants(initialApplicants || [], stageNames));
    }

    setAllPositions(initialPositions || []);
    setAllUsers(initialUsers || []);
    setFetchError(initialFetchError || null);
    setAuthError(serverAuthError);
    setPermissionError(serverPermissionError);

    if (status === 'unauthenticated' && !serverAuthError) {
      signIn(undefined, { callbackUrl: window.location.pathname });
    }

    if (initialFetchError) {
      toast.error(initialFetchError);
    }
  }, [
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
  ]);
}

interface DashboardInitialClientFetchInput {
  fetchDataClientSide: () => void | Promise<void>;
  hasFetchedClientDataRef: { current: boolean };
  initialApplicants: Applicant[];
  initialPositions: Position[];
  sessionUserId?: string;
  status: string;
}

export function useDashboardInitialClientFetch({
  fetchDataClientSide,
  hasFetchedClientDataRef,
  initialApplicants,
  initialPositions,
  sessionUserId,
  status,
}: DashboardInitialClientFetchInput) {
  useEffect(() => {
    if (status === 'authenticated' && sessionUserId && !hasFetchedClientDataRef.current) {
      const hasInitialData = (initialApplicants && initialApplicants.length > 0) ||
        (initialPositions && initialPositions.length > 0);

      if (!hasInitialData) {
        hasFetchedClientDataRef.current = true;
        void fetchDataClientSide();
      }
    }
  }, [fetchDataClientSide, hasFetchedClientDataRef, initialApplicants, initialPositions, sessionUserId, status]);
}
