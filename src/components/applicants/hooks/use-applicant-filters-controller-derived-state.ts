"use client";

import { useMemo } from 'react';

import {
  buildApplicantCurrentFilterSyncState,
  buildApplicantFilterStateSignal,
} from '../applicant-filter-query-utils';
import type { useApplicantStandardFilterState } from './use-applicant-standard-filter-state';

type ApplicantStandardFilterState = ReturnType<typeof useApplicantStandardFilterState>;

export function useApplicantFiltersControllerDerivedState(
  standard: ApplicantStandardFilterState,
) {
  const filterSyncSetters = useMemo(() => ({
    setName: standard.setName,
    setEmail: standard.setEmail,
    setPhone: standard.setPhone,
    setSelectedPositionIds: standard.setSelectedPositionIds,
    setSelectedStatuses: standard.setSelectedStatuses,
    setSelectedSourceIds: standard.setSelectedSourceIds,
    setSkills: standard.setSkills,
    setLocation: standard.setLocation,
    setLocationOperator: standard.setLocationOperator,
    setExperienceYearsRange: standard.setExperienceYearsRange,
    setApplicationDateRange: standard.setApplicationDateRange,
    setSelectedRecruiterIds: standard.setSelectedRecruiterIds,
    setAiSearchQueryInput: standard.setAiSearchQueryInput,
    setCustomFieldFilters: standard.setCustomFieldFilters,
  }), [
    standard.setName,
    standard.setEmail,
    standard.setPhone,
    standard.setSelectedPositionIds,
    standard.setSelectedStatuses,
    standard.setSelectedSourceIds,
    standard.setSkills,
    standard.setLocation,
    standard.setLocationOperator,
    standard.setExperienceYearsRange,
    standard.setApplicationDateRange,
    standard.setSelectedRecruiterIds,
    standard.setAiSearchQueryInput,
    standard.setCustomFieldFilters,
  ]);

  const currentFilterSyncState = useMemo(() => buildApplicantCurrentFilterSyncState({
    name: standard.name,
    email: standard.email,
    phone: standard.phone,
    selectedPositionIds: standard.selectedPositionIds,
    selectedStatuses: standard.selectedStatuses,
    selectedSourceIds: standard.selectedSourceIds,
    skills: standard.skills,
    location: standard.location,
    locationOperator: standard.locationOperator,
    experienceYearsRange: standard.experienceYearsRange,
    applicationDateRange: standard.applicationDateRange,
    selectedRecruiterIds: standard.selectedRecruiterIds,
    customFieldFilters: standard.customFieldFilters,
  }), [
    standard.name,
    standard.email,
    standard.phone,
    standard.selectedPositionIds,
    standard.selectedStatuses,
    standard.selectedSourceIds,
    standard.skills,
    standard.location,
    standard.locationOperator,
    standard.experienceYearsRange,
    standard.applicationDateRange,
    standard.selectedRecruiterIds,
    standard.customFieldFilters,
  ]);

  const filterStateSignal = useMemo(() => buildApplicantFilterStateSignal({
    name: standard.name,
    nameOperator: standard.nameOperator,
    email: standard.email,
    emailOperator: standard.emailOperator,
    phone: standard.phone,
    phoneOperator: standard.phoneOperator,
    location: standard.location,
    locationOperator: standard.locationOperator,
    selectedPositionIds: standard.selectedPositionIds,
    selectedStatuses: standard.selectedStatuses,
    selectedRecruiterIds: standard.selectedRecruiterIds,
    selectedSourceIds: standard.selectedSourceIds,
    skills: standard.skills,
    experienceYearsRange: standard.experienceYearsRange,
    applicationDateRange: standard.applicationDateRange,
    customFieldFilters: standard.customFieldFilters,
  }), [
    standard.name,
    standard.nameOperator,
    standard.email,
    standard.emailOperator,
    standard.phone,
    standard.phoneOperator,
    standard.location,
    standard.locationOperator,
    standard.selectedPositionIds,
    standard.selectedStatuses,
    standard.selectedRecruiterIds,
    standard.selectedSourceIds,
    standard.skills,
    standard.experienceYearsRange,
    standard.applicationDateRange,
    standard.customFieldFilters,
  ]);

  return {
    currentFilterSyncState,
    filterStateSignal,
    filterSyncSetters,
  };
}
