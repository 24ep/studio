import { useEffect, useState } from 'react';

import { readJsonOrFallback } from '@/lib/response-json';

import type { HiringDetails } from './hiring-detail-types';

interface UseHiringDetailsResult {
  data: HiringDetails | null;
  loading: boolean;
  error: string | null;
}

export function useHiringDetails(userId: string): UseHiringDetailsResult {
  const [data, setData] = useState<HiringDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${userId}/hiring-details`);
        if (!response.ok) {
          throw new Error('Failed to fetch hiring details');
        }

        const result = await readJsonOrFallback<HiringDetails | null>(response, null);
        if (!cancelled) {
          setData(result);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setError('Failed to load hiring information');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (userId) {
      fetchData();
    } else {
      setData(null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading, error };
}
