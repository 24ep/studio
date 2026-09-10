import type { DateRange } from 'react-day-picker';

import type { ApplicantCustomFieldFilterValue, ApplicantFilterValues } from '../../lib/types';
import { createApplicantSkillsSet } from './applicant-filter-option-utils';
import {
  areStringSetsEqual,
  parseApplicantFilterDateRange,
  type ApplicantLocationOperator,
} from './applicant-filter-shared-utils';
export {
  areApplicantFilterSnapshotsEqual,
  type ApplicantFilterSnapshotInput,
} from './applicant-filter-sync-snapshots';

export function buildApplicantFilterSyncState(initialFilters: ApplicantFilterValues) {
  return {
    name: initialFilters.name || '',
    email: initialFilters.email || '',
    phone: initialFilters.phone || '',
    selectedPositionIds: new Set(initialFilters.selectedPositionIds || []),
    selectedStatuses: new Set(initialFilters.selectedStatuses || []),
    selectedSourceIds: new Set(initialFilters.selectedSourceIds || []),
    skills: createApplicantSkillsSet(initialFilters.skills),
    location: initialFilters.location || '',
    locationOperator: initialFilters.locationOperator || 'contains',
    experienceYearsRange: [
      initialFilters.minExperienceYears ?? 0,
      initialFilters.maxExperienceYears || 50,
    ] as [number, number],
    applicationDateRange: parseApplicantFilterDateRange(initialFilters),
    selectedRecruiterIds: new Set(initialFilters.selectedRecruiterIds || []),
    aiSearchQueryInput: initialFilters.aiSearchQuery || '',
    customFieldFilters: initialFilters.customFieldFilters || {},
  };
}

export type ApplicantFilterSyncState = ReturnType<typeof buildApplicantFilterSyncState>;

type ApplicantFilterStateSetter<T> = (value: T) => void;

export interface ApplicantFilterSyncStateSetters {
  setName: ApplicantFilterStateSetter<string>;
  setEmail: ApplicantFilterStateSetter<string>;
  setPhone: ApplicantFilterStateSetter<string>;
  setSelectedPositionIds: ApplicantFilterStateSetter<Set<string>>;
  setSelectedStatuses: ApplicantFilterStateSetter<Set<string>>;
  setSelectedSourceIds: ApplicantFilterStateSetter<Set<string>>;
  setSkills: ApplicantFilterStateSetter<Set<string>>;
  setLocation: ApplicantFilterStateSetter<string>;
  setLocationOperator: ApplicantFilterStateSetter<ApplicantLocationOperator>;
  setExperienceYearsRange: ApplicantFilterStateSetter<[number, number]>;
  setApplicationDateRange: ApplicantFilterStateSetter<DateRange | undefined>;
  setSelectedRecruiterIds: ApplicantFilterStateSetter<Set<string>>;
  setAiSearchQueryInput: ApplicantFilterStateSetter<string>;
  setCustomFieldFilters: ApplicantFilterStateSetter<Record<string, ApplicantCustomFieldFilterValue>>;
}

interface CurrentApplicantFilterSyncState {
  selectedPositionIds: Set<string>;
  selectedStatuses: Set<string>;
  selectedSourceIds: Set<string>;
  skills: Set<string>;
  experienceYearsRange: [number, number];
  selectedRecruiterIds: Set<string>;
}

export function applyApplicantFilterSyncState({
  syncState,
  setters,
  currentState,
  isTypingName = false,
  isTypingLocation = false,
}: {
  syncState: ApplicantFilterSyncState;
  setters: ApplicantFilterSyncStateSetters;
  currentState?: CurrentApplicantFilterSyncState;
  isTypingName?: boolean;
  isTypingLocation?: boolean;
}) {
  if (!isTypingName) setters.setName(syncState.name);
  setters.setEmail(syncState.email);
  setters.setPhone(syncState.phone);

  if (!currentState || !areStringSetsEqual(currentState.selectedPositionIds, syncState.selectedPositionIds)) {
    setters.setSelectedPositionIds(syncState.selectedPositionIds);
  }

  if (!currentState || !areStringSetsEqual(currentState.selectedStatuses, syncState.selectedStatuses)) {
    setters.setSelectedStatuses(syncState.selectedStatuses);
  }

  if (!currentState || !areStringSetsEqual(currentState.selectedSourceIds, syncState.selectedSourceIds)) {
    setters.setSelectedSourceIds(syncState.selectedSourceIds);
  }

  if (!currentState || !areStringSetsEqual(currentState.skills, syncState.skills)) {
    setters.setSkills(syncState.skills);
  }

  if (!isTypingLocation) setters.setLocation(syncState.location);
  setters.setLocationOperator(syncState.locationOperator);

  if (
    !currentState ||
    currentState.experienceYearsRange[0] !== syncState.experienceYearsRange[0] ||
    currentState.experienceYearsRange[1] !== syncState.experienceYearsRange[1]
  ) {
    setters.setExperienceYearsRange(syncState.experienceYearsRange);
  }

  setters.setApplicationDateRange(syncState.applicationDateRange);

  if (!currentState || !areStringSetsEqual(currentState.selectedRecruiterIds, syncState.selectedRecruiterIds)) {
    setters.setSelectedRecruiterIds(syncState.selectedRecruiterIds);
  }

  setters.setAiSearchQueryInput(syncState.aiSearchQueryInput);
  setters.setCustomFieldFilters(syncState.customFieldFilters);
}
