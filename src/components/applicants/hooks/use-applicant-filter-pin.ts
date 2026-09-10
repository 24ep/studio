import { useCallback, useState } from 'react';

const APPLICANT_FILTER_PINNED_KEY = 'applicant-filter-pinned';

export function useApplicantFilterPin() {
  const [isFilterPinned, setIsFilterPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(APPLICANT_FILTER_PINNED_KEY) === 'true';
    }
    return false;
  });

  const handleToggleFilterPin = useCallback((pinned: boolean) => {
    setIsFilterPinned(pinned);
    if (typeof window !== 'undefined') {
      localStorage.setItem(APPLICANT_FILTER_PINNED_KEY, pinned ? 'true' : 'false');
    }
  }, []);

  return {
    isFilterPinned,
    handleToggleFilterPin,
  };
}
