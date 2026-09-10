import { useCallback, useEffect, useState } from 'react';
import type { Session } from 'next-auth';

import { safeFetch } from '@/lib/safe-fetch';
import type { DashboardHeadcountSummary } from '../DashboardHeadcountStatusCard';

export function useDashboardHeadcountData({
  allPositionsCount,
  sessionUser,
  status,
}: {
  allPositionsCount: number;
  sessionUser?: Session['user'] | null;
  status: string;
}) {
  const [headcountData, setHeadcountData] = useState<DashboardHeadcountSummary[]>([]);
  const [headcountLoading, setHeadcountLoading] = useState(false);

  const fetchHeadcountData = useCallback(async () => {
    if (status !== 'authenticated' || !sessionUser?.id) {
      return;
    }

    setHeadcountLoading(true);
    try {
      const headcountRes = await safeFetch('/api/dashboard/headcount-summary', {
        credentials: 'include' as const,
        timeoutMs: 15000,
      });

      if (!headcountRes.ok || !headcountRes.data) {
        console.warn('Failed to fetch headcount summary');
        setHeadcountData([]);
        return;
      }

      setHeadcountData(Array.isArray(headcountRes.data) ? headcountRes.data as DashboardHeadcountSummary[] : []);
    } catch (error) {
      console.error('Error fetching headcount data:', error);
      setHeadcountData([]);
    } finally {
      setHeadcountLoading(false);
    }
  }, [sessionUser?.id, status]);

  useEffect(() => {
    if (status === 'authenticated' && sessionUser?.id && allPositionsCount > 0) {
      void fetchHeadcountData();
    }
  }, [allPositionsCount, fetchHeadcountData, sessionUser?.id, status]);

  return {
    fetchHeadcountData,
    headcountData,
    headcountLoading,
  };
}
