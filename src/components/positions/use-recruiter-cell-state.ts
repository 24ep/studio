import { useEffect, useMemo, useRef, useState } from 'react';

import type { RecruiterCellProps } from './RecruiterCellTypes';

export const ASSIGNMENT_AUTO_RESET_MS = 3000;

export function useRecruiterCellState({
  position,
  availableRecruiter,
  isAssigning,
  onAssignRecruiter,
  onResetAssigning,
}: Pick<
  RecruiterCellProps,
  'position' | 'availableRecruiter' | 'isAssigning' | 'onAssignRecruiter' | 'onResetAssigning'
>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentRecruiter = useMemo(
    () => availableRecruiter.find((recruiter) => recruiter.id === position.recruiterId),
    [availableRecruiter, position.recruiterId]
  );

  const filteredRecruiter = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return availableRecruiter;

    return availableRecruiter.filter((recruiter) =>
      recruiter.name.toLowerCase().includes(searchLower)
    );
  }, [availableRecruiter, searchTerm]);

  useEffect(() => {
    if (!isAssigning) return;

    const timeout = setTimeout(() => {
      console.warn(`RecruiterCell: Auto-resetting stuck assignment state for position ${position.id}`);
      onResetAssigning?.();
    }, ASSIGNMENT_AUTO_RESET_MS);

    return () => clearTimeout(timeout);
  }, [isAssigning, position.id, onResetAssigning]);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || isAssigning) return;

    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, [open, isAssigning]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isAssigning) {
      setOpen(newOpen);
    }
  };

  const handleSelect = async (recruiterId: string | null) => {
    if (isAssigning) {
      console.warn('RecruiterCell: Assignment already in progress, ignoring selection');
      return;
    }

    setOpen(false);

    try {
      await onAssignRecruiter(position.id, recruiterId);
    } catch (error) {
      console.error('RecruiterCell: Error in handleSelect:', error);
      setOpen(true);
    }
  };

  return {
    currentRecruiter,
    filteredRecruiter,
    handleOpenChange,
    handleSelect,
    open,
    searchInputRef,
    searchTerm,
    setSearchTerm,
  };
}
