import { useCallback, useState } from 'react';

import type { ApplicantCustomFieldFilterValue, ApplicantFilterValues } from '@/lib/types';
import {
  buildStandardApplicantFilters,
  hasActiveApplicantFilterState,
} from '../applicant-filter-query-utils';
import {
  createApplicantStandardFilterInitialState,
  syncAdvancedQueryFiltersToStandardState,
  type LocationOperator,
  type TextOperator,
} from './applicant-standard-filter-state-utils';

interface UseApplicantStandardFilterStateInput {
  initialFilters: ApplicantFilterValues;
  onClearAllFilters: () => void;
}

export function useApplicantStandardFilterState({
  initialFilters,
  onClearAllFilters,
}: UseApplicantStandardFilterStateInput) {
  const initialState = createApplicantStandardFilterInitialState(initialFilters);
  const [name, setName] = useState(initialState.name);
  const [email, setEmail] = useState(initialState.email);
  const [phone, setPhone] = useState(initialState.phone);
  const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(initialState.selectedPositionIds);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(initialState.selectedStatuses);
  const [skills, setSkills] = useState<Set<string>>(initialState.skills);
  const [location, setLocation] = useState(initialState.location);
  const [isTypingName, setIsTypingName] = useState(false);
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [experienceYearsRange, setExperienceYearsRange] = useState<[number, number]>(initialState.experienceYearsRange);
  const [applicationDateRange, setApplicationDateRange] = useState(initialState.applicationDateRange);
  const [selectedRecruiterIds, setSelectedRecruiterIds] = useState<Set<string>>(initialState.selectedRecruiterIds);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(initialState.selectedSourceIds);
  const [aiSearchQueryInput, setAiSearchQueryInput] = useState(initialState.aiSearchQueryInput);
  const [customFieldFilters, setCustomFieldFilters] = useState<Record<string, ApplicantCustomFieldFilterValue>>(
    initialState.customFieldFilters
  );
  const [expandedAttributes, setExpandedAttributes] = useState<{ [key: string]: boolean }>({});
  const [nameOperator, setNameOperator] = useState<TextOperator>('contains');
  const [emailOperator, setEmailOperator] = useState<TextOperator>('contains');
  const [phoneOperator, setPhoneOperator] = useState<TextOperator>('contains');
  const [locationOperator, setLocationOperator] = useState<LocationOperator>(initialState.locationOperator);

  const buildCurrentStandardFilters = useCallback((
    overrides: Partial<{
      selectedPositionIds: Set<string>;
    }> = {},
    options?: { preserveEmptyTextFilters?: boolean }
  ) => buildStandardApplicantFilters({
    name,
    nameOperator,
    email,
    emailOperator,
    phone,
    phoneOperator,
    selectedPositionIds: overrides.selectedPositionIds || selectedPositionIds,
    selectedStatuses,
    selectedSourceIds,
    skills,
    location,
    locationOperator,
    experienceYearsRange,
    applicationDateRange,
    selectedRecruiterIds,
    customFieldFilters,
  }, options), [
    name,
    nameOperator,
    email,
    emailOperator,
    phone,
    phoneOperator,
    selectedPositionIds,
    selectedStatuses,
    selectedSourceIds,
    skills,
    location,
    locationOperator,
    experienceYearsRange,
    applicationDateRange,
    selectedRecruiterIds,
    customFieldFilters,
  ]);

  const syncAdvancedQueryFiltersToState = useCallback((parsedFilters: ApplicantFilterValues) => {
    syncAdvancedQueryFiltersToStandardState({
      isTypingLocation,
      isTypingName,
      parsedFilters,
      setters: {
        setApplicationDateRange,
        setEmail,
        setLocation,
        setLocationOperator,
        setName,
        setPhone,
        setSelectedPositionIds,
        setSelectedRecruiterIds,
        setSelectedStatuses,
      },
    });
  }, [isTypingLocation, isTypingName]);

  const getHasActiveFilters = useCallback((advancedQueryInput: string) => (
    hasActiveApplicantFilterState({
      name,
      email,
      phone,
      location,
      skills,
      selectedPositionIds,
      selectedStatuses,
      selectedRecruiterIds,
      selectedSourceIds,
      experienceYearsRange,
      applicationDateRange,
      customFieldFilters,
      advancedQueryInput,
    })
  ), [
    name,
    email,
    phone,
    location,
    skills,
    selectedPositionIds,
    selectedStatuses,
    selectedRecruiterIds,
    selectedSourceIds,
    experienceYearsRange,
    applicationDateRange,
    customFieldFilters,
  ]);

  const resetFilters = useCallback(() => {
    onClearAllFilters();
  }, [onClearAllFilters]);

  const toggleSeeMore = useCallback((attributeKey: string) => {
    setExpandedAttributes(prev => ({
      ...prev,
      [attributeKey]: !prev[attributeKey],
    }));
  }, []);

  return {
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    selectedPositionIds,
    setSelectedPositionIds,
    selectedStatuses,
    setSelectedStatuses,
    skills,
    setSkills,
    location,
    setLocation,
    isTypingName,
    setIsTypingName,
    isTypingLocation,
    setIsTypingLocation,
    experienceYearsRange,
    setExperienceYearsRange,
    applicationDateRange,
    setApplicationDateRange,
    selectedRecruiterIds,
    setSelectedRecruiterIds,
    selectedSourceIds,
    setSelectedSourceIds,
    aiSearchQueryInput,
    setAiSearchQueryInput,
    customFieldFilters,
    setCustomFieldFilters,
    expandedAttributes,
    nameOperator,
    setNameOperator,
    emailOperator,
    setEmailOperator,
    phoneOperator,
    setPhoneOperator,
    locationOperator,
    setLocationOperator,
    buildCurrentStandardFilters,
    getHasActiveFilters,
    resetFilters,
    syncAdvancedQueryFiltersToState,
    toggleSeeMore,
  };
}
