import { useCallback, useEffect, useState } from 'react';

import {
  fetchCalendarPositionValidation,
  searchCalendarApplicants,
} from './calendar-create-link-api';
import {
  createEmptyPositionValidation,
  type CalendarInterviewer,
  type PositionValidation,
  type SearchApplicant,
} from './calendar-page-utils';

export function useCalendarCreateLinkSelection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchApplicant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<SearchApplicant | null>(null);
  const [availableInterviewers, setAvailableInterviewers] = useState<CalendarInterviewer[]>([]);
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<Set<string>>(new Set());
  const [positionValidation, setPositionValidation] = useState<PositionValidation>(createEmptyPositionValidation());

  const resetSelectionState = useCallback(() => {
    setSelectedApplicant(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedInterviewerIds(new Set());
    setAvailableInterviewers([]);
    setPositionValidation(createEmptyPositionValidation());
  }, []);

  const searchApplicants = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchResults(await searchCalendarApplicants(query));
    } catch (error) {
      console.error('Error searching Applicants:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const validatePosition = useCallback(async (positionId: string, positionTitle: string | null) => {
    setPositionValidation({
      hasInterviewers: false,
      hasSkills: false,
      positionId,
      positionTitle,
      isLoading: true,
      error: null,
    });

    try {
      const validationResult = await fetchCalendarPositionValidation(positionId, positionTitle);
      setAvailableInterviewers(validationResult.availableInterviewers);
      setSelectedInterviewerIds(new Set(validationResult.availableInterviewers.map((interviewer) => interviewer.id)));
      setPositionValidation(validationResult.positionValidation);
    } catch (error) {
      console.error('Error validating position:', error);
      setPositionValidation({
        hasInterviewers: false,
        hasSkills: false,
        positionId,
        positionTitle,
        isLoading: false,
        error: 'Failed to validate position configuration',
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchApplicants(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchApplicants, searchQuery]);

  useEffect(() => {
    if (!selectedApplicant) {
      setPositionValidation(createEmptyPositionValidation());
      return;
    }

    const positionId = selectedApplicant.positionId || selectedApplicant.position?.id;
    if (positionId) {
      validatePosition(positionId, selectedApplicant.position?.title || null);
      return;
    }

    setPositionValidation(createEmptyPositionValidation({ error: 'Applicant has no assigned position' }));
  }, [selectedApplicant, validatePosition]);

  return {
    availableInterviewers,
    isSearching,
    positionValidation,
    resetSelectionState,
    searchQuery,
    searchResults,
    selectedApplicant,
    selectedInterviewerIds,
    setSearchQuery,
    setSearchResults,
    setSelectedApplicant,
    setSelectedInterviewerIds,
  };
}
