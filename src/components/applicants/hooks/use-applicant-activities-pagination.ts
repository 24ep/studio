import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { fetchApplicantActivitiesPage } from '../applicant-comments-api';
import type { ApplicantActivityLogItem } from '../applicant-comments-utils';
import type { ApplicantCommentsCounts } from './use-applicant-reminders';
import { ACTIVITIES_PER_LOAD } from './applicant-comments-feed-constants';

interface UseApplicantActivitiesPaginationParams {
  applicantId: string;
  setCounts: Dispatch<SetStateAction<ApplicantCommentsCounts>>;
}

export function useApplicantActivitiesPagination({
  applicantId,
  setCounts,
}: UseApplicantActivitiesPaginationParams) {
  const [logs, setLogs] = useState<ApplicantActivityLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [activitiesOffset, setActivitiesOffset] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    setLogsLoading(true);
    fetchApplicantActivitiesPage({
      applicantId,
      limit: ACTIVITIES_PER_LOAD,
      offset: 0,
    })
      .then(page => {
        if (cancelled) return;

        if (!page) {
          setLogs([]);
          setActivitiesOffset(0);
          setHasMoreActivities(false);
          return;
        }

        setLogs(page.logs);
        setActivitiesOffset(page.logs.length);
        setHasMoreActivities(page.hasMore);
        setCounts(prev => ({
          ...prev,
          activity: page.total,
          all: prev.comment + prev.remark + page.total,
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setLogs([]);
        setActivitiesOffset(0);
        setHasMoreActivities(false);
      })
      .finally(() => {
        if (!cancelled) {
          setLogsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [applicantId, setCounts]);

  const loadMoreActivities = useCallback(async () => {
    if (loadingMoreActivities || !hasMoreActivities) return;

    setLoadingMoreActivities(true);
    try {
      const page = await fetchApplicantActivitiesPage({
        applicantId,
        limit: ACTIVITIES_PER_LOAD,
        offset: activitiesOffset,
      });

      if (!mountedRef.current || !page) return;

      if (page.logs.length > 0) {
        setLogs(prev => [...prev, ...page.logs]);
        setActivitiesOffset(prev => prev + page.logs.length);
        setHasMoreActivities(page.hasMore);
      } else {
        setHasMoreActivities(false);
      }
    } catch (error) {
      console.error('Error loading more activities:', error);
    } finally {
      if (mountedRef.current) {
        setLoadingMoreActivities(false);
      }
    }
  }, [activitiesOffset, applicantId, hasMoreActivities, loadingMoreActivities]);

  return {
    hasMoreActivities,
    loadingMoreActivities,
    loadMoreActivities,
    logs,
    logsLoading,
  };
}
