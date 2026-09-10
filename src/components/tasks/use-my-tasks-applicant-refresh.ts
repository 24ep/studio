import type React from 'react';
import { useEffect, useState } from 'react';

import { useSharedSSE } from '@/hooks/use-shared-sse';

import {
  type TaskboardApplicant,
} from './my-tasks-page-utils';
import {
  refreshTaskboardApplicantsIfChanged,
  reloadTaskboardApplicants,
  shouldHandleMyTasksApplicantRefreshEvent,
} from './my-tasks-applicant-refresh-utils';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';

interface UseMyTasksApplicantRefreshInput {
  applicants: TaskboardApplicant[];
  buildTaskboardApplicantParams: () => URLSearchParams;
  loading: boolean;
  sessionUserId?: string | null;
  setApplicants: React.Dispatch<React.SetStateAction<TaskboardApplicant[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  status: string;
}

export function useMyTasksApplicantRefresh({
  applicants,
  buildTaskboardApplicantParams,
  loading,
  sessionUserId,
  setApplicants,
  setLoading,
  status,
}: UseMyTasksApplicantRefreshInput) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { subscribeToEvents } = useSharedSSE();

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: NodeJS.Timeout;
    let lastUpdateTime = 0;
    const minUpdateInterval = 300;

    if (status !== 'authenticated' || !sessionUserId) {
      return;
    }

    const unsubscribe = subscribeToEvents((event) => {
      if (!mounted) return;

      if (!shouldHandleMyTasksApplicantRefreshEvent(event.type)) {
        return;
      }

      const now = Date.now();
      if (now - lastUpdateTime < minUpdateInterval) {
        return;
      }

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        if (mounted && status === 'authenticated' && sessionUserId) {
          lastUpdateTime = Date.now();
          if (!loading) {
            setRefreshTrigger(prev => prev + 1);
          }
        }
      }, 200);
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, [status, sessionUserId, loading, subscribeToEvents]);

  useEffect(() => {
    if (refreshTrigger <= 0) {
      return;
    }

    reloadTaskboardApplicants({
      buildTaskboardApplicantParams,
      resetOnFailure: true,
      setApplicants,
      setLoading,
    });
  }, [refreshTrigger, buildTaskboardApplicantParams, setApplicants, setLoading]);

  useVisibilityInterval(() => {
    if (!sessionUserId || loading || applicants.length === 0) {
      return;
    }

    refreshTaskboardApplicantsIfChanged({
      applicants,
      buildTaskboardApplicantParams,
      setApplicants,
    });
  }, applicants.length > 0 ? 10000 : 30000, Boolean(sessionUserId));
}
