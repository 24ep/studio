import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Applicant } from '@/lib/types';

interface UseApplicantAutoMarkReadInput {
  applicant: Applicant | null;
  setApplicant: Dispatch<SetStateAction<Applicant | null>>;
}

export function useApplicantAutoMarkRead({
  applicant,
  setApplicant,
}: UseApplicantAutoMarkReadInput) {
  const autoMarkReadAttempted = useRef<string | null>(null);

  useEffect(() => {
    if (!applicant?.id || applicant.isRead !== false || autoMarkReadAttempted.current === applicant.id) {
      return undefined;
    }

    autoMarkReadAttempted.current = applicant.id;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/applicants/${applicant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
          credentials: 'include',
        });

        if (res.ok) {
          setApplicant(prev => prev ? { ...prev, isRead: true } : prev);
        }
      } catch (error) {
        console.error('[useApplicantAutoMarkRead] Failed to auto-mark as read:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [applicant, setApplicant]);
}
