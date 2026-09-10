import { useEffect } from 'react';

interface UseDebouncedPositionApplicantFetchProps {
  enabled: boolean;
  fetchApplicants: () => void | Promise<void>;
  dependencies: readonly unknown[];
  errorContext: string;
  debounceMs?: number;
}

export function useDebouncedPositionApplicantFetch({
  enabled,
  fetchApplicants,
  dependencies,
  errorContext,
  debounceMs = 500,
}: UseDebouncedPositionApplicantFetchProps) {
  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetchApplicants();
      } catch (error) {
        console.error(`Error fetching ${errorContext}:`, error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [enabled, fetchApplicants, errorContext, debounceMs, ...dependencies]);
}
