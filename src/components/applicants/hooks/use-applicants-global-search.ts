import { useEffect } from 'react';
import type { ApplicantFilterValues } from '@/lib/types';

export function useApplicantsGlobalSearch(
  onFilterChange: (filterPatch: Partial<ApplicantFilterValues>) => void
) {
  useEffect(() => {
    const handleGlobalSearch = (event: Event) => {
      const query = (event as CustomEvent<string>).detail;
      if (query !== undefined) {
        onFilterChange({ name: query });
      }
    };

    window.addEventListener('global:search', handleGlobalSearch);
    return () => window.removeEventListener('global:search', handleGlobalSearch);
  }, [onFilterChange]);
}
