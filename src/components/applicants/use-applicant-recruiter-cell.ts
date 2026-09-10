import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import type {
  ApplicantRecruiterCellApplicant,
  ApplicantRecruiterOption,
} from './applicant-recruiter-cell-types';
import {
  filterApplicantRecruiters,
  getApplicantDisplayRecruiter,
} from './applicant-recruiter-cell-utils';

interface UseApplicantRecruiterCellInput {
  applicant: ApplicantRecruiterCellApplicant;
  availableRecruiter: ApplicantRecruiterOption[];
  isAssigning: boolean;
  onAssignRecruiter: (applicantId: string, recruiterId: string | null) => void;
  onResetAssigning?: () => void;
}

export function useApplicantRecruiterCell({
  applicant,
  availableRecruiter,
  isAssigning,
  onAssignRecruiter,
  onResetAssigning,
}: UseApplicantRecruiterCellInput) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayRecruiter = useMemo(() => (
    getApplicantDisplayRecruiter(applicant, availableRecruiter)
  ), [applicant, availableRecruiter]);

  const filteredRecruiter = useMemo(() => (
    filterApplicantRecruiters(availableRecruiter, searchTerm)
  ), [availableRecruiter, searchTerm]);

  useEffect(() => {
    if (!isAssigning) return;

    const timeout = setTimeout(() => {
      onResetAssigning?.();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isAssigning, onResetAssigning]);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isAssigning) {
      setOpen(newOpen);
    }
  };

  const handleSelect = (recruiterId: string | null) => {
    if (isAssigning) return;

    setOpen(false);
    onAssignRecruiter(applicant.id, recruiterId);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return {
    displayRecruiter,
    filteredRecruiter,
    handleClearSearch,
    handleOpenChange,
    handleSearchChange,
    handleSelect,
    open,
    searchInputRef,
    searchTerm,
  };
}
