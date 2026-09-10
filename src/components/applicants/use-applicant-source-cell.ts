import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';

import type { ApplicantSourceCellProps } from './ApplicantSourceCellTypes';

export function useApplicantSourceCell({
  applicant,
  availableSources,
  isAssigning,
  onAssignSource,
  onResetAssigning,
}: Pick<
  ApplicantSourceCellProps,
  'applicant' | 'availableSources' | 'isAssigning' | 'onAssignSource' | 'onResetAssigning'
>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subSource, setSubSource] = useState(applicant.subSource || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSubSource(applicant.subSource || '');
  }, [applicant.subSource]);

  const currentSource = useMemo(() =>
    availableSources.find((source) => source.id === applicant.sourceId) || applicant.source,
  [availableSources, applicant.sourceId, applicant.source]);

  const filteredSources = useMemo(() => {
    if (!searchTerm.trim()) {
      return availableSources;
    }

    const searchLower = searchTerm.toLowerCase();
    return availableSources.filter((source) =>
      source.name.toLowerCase().includes(searchLower),
    );
  }, [availableSources, searchTerm]);

  useEffect(() => {
    if (!isAssigning) {
      return;
    }

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
    if (!open) {
      return;
    }

    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, [open]);

  return {
    currentSource,
    filteredSources,
    open,
    searchInputRef,
    searchTerm,
    setOpen(nextOpen: boolean) {
      if (!isAssigning) {
        setOpen(nextOpen);
      }
    },
    subSource,
    clearSearch() {
      setSearchTerm('');
    },
    handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
      setSearchTerm(event.target.value);
    },
    handleSelect(sourceId: string | null) {
      if (isAssigning) {
        return;
      }

      setOpen(false);
      onAssignSource(applicant.id, sourceId, sourceId ? subSource : null);
    },
    handleSubSourceBlur() {
      if (applicant.sourceId && subSource !== applicant.subSource) {
        onAssignSource(applicant.id, applicant.sourceId, subSource);
      }
    },
    handleSubSourceChange(event: ChangeEvent<HTMLInputElement>) {
      setSubSource(event.target.value);
    },
  };
}
