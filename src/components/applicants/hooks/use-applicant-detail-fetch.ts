import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Applicant } from '@/lib/types';
import { readJsonOrFallback } from '@/lib/response-json';

interface UseApplicantDetailFetchOptions {
  applicant: Applicant | null;
  applicantId: string;
  initialApplicant: Applicant | null;
  setApplicant: Dispatch<SetStateAction<Applicant | null>>;
}

function getApplicantDetailFetchErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to load Applicant details';
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

export function useApplicantDetailFetch({
  applicant,
  applicantId,
  initialApplicant,
  setApplicant,
}: UseApplicantDetailFetchOptions) {
  const [loading, setLoading] = useState(!initialApplicant);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchApplicantCount = useRef(0);

  const fetchApplicant = useCallback(async () => {
    fetchApplicantCount.current++;
    if (!applicantId) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!applicant) {
      setLoading(true);
    }
    setError(null);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const maxAttempts = 3;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(`/api/applicants/${applicantId}?lite=1`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          console.error(`use-applicant-detail API call failed with status ${res.status} for applicantId: ${applicantId}`);
          if (res.status === 401) {
            lastError = new Error('Unauthorized. Please sign in again.');
            break;
          }
          if (res.status === 404) {
            lastError = new Error('Applicant not found');
            break;
          }
          if (res.status === 408 || res.status === 503 || res.status === 500) {
            lastError = new Error(res.status === 408 ? 'Server timed out.' : 'Server temporarily unavailable.');
            if (attempt < maxAttempts) {
              await delay(attempt * 1000);
              abortControllerRef.current = new AbortController();
              continue;
            }
            break;
          }
          lastError = new Error(`Failed to fetch applicant: ${res.status} ${res.statusText}`);
          break;
        }

        const data = await readJsonOrFallback<Applicant | null>(res, null);
        if (!data) {
          lastError = new Error('Failed to load Applicant details');
          break;
        }
        if (!isMountedRef.current) {
          return;
        }

        setApplicant(data);
        setLoading(false);
        setError(null);
        return;
      } catch (error: unknown) {
        if (!isMountedRef.current) {
          return;
        }

        if (isAbortError(error)) {
          lastError = new Error('Request timed out. Please try again.');
        } else {
          console.error(`use-applicant-detail error fetching applicant for applicantId: ${applicantId} (attempt ${attempt}):`, error);
          lastError = error;
        }

        if (attempt < maxAttempts) {
          await delay(attempt * 1000);
          abortControllerRef.current = new AbortController();
          continue;
        }
        lastError = error;
        break;
      }
    }

    setError(getApplicantDetailFetchErrorMessage(lastError));
    setLoading(false);
  }, [applicant, applicantId, setApplicant]);

  useEffect(() => {
    if (!initialApplicant) return;

    setApplicant((previousApplicant) => previousApplicant ?? initialApplicant);
    setLoading(false);
  }, [initialApplicant, setApplicant]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchApplicant();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [applicantId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    error,
    fetchApplicant,
    loading,
  };
}
