import type { DateRange } from 'react-day-picker';

import type { ApplicantCustomFieldFilterValue, ApplicantFilterValues } from '../../lib/types';
import type { ApplicantLocationOperator } from './applicant-filter-shared-utils';

export interface ApplicantFilterSnapshotInput {
  name: string;
  email: string;
  phone: string;
  nameOperator?: ApplicantFilterValues['nameOperator'];
  emailOperator?: ApplicantFilterValues['emailOperator'];
  phoneOperator?: ApplicantFilterValues['phoneOperator'];
  selectedPositionIds: Set<string>;
  selectedStatuses: Set<string>;
  selectedSourceIds: Set<string>;
  skills: Set<string>;
  location: string;
  locationOperator: ApplicantFilterValues['locationOperator'];
  experienceYearsRange: [number, number];
  applicationDateRange?: DateRange;
  selectedRecruiterIds: Set<string>;
  customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>;
}

function buildCurrentFilterSnapshot({
  name,
  email,
  phone,
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
}: ApplicantFilterSnapshotInput) {
  return {
    name,
    email,
    phone,
    selectedPositionIds: Array.from(selectedPositionIds),
    selectedStatuses: Array.from(selectedStatuses),
    selectedSourceIds: Array.from(selectedSourceIds),
    skills: Array.from(skills).join(','),
    location,
    locationOperator,
    minExperienceYears: experienceYearsRange[0],
    maxExperienceYears: experienceYearsRange[1],
    applicationDateStart: applicationDateRange?.from,
    applicationDateEnd: applicationDateRange?.to,
    selectedRecruiterIds: Array.from(selectedRecruiterIds),
    customFieldFilters,
  };
}

function buildIncomingFilterSnapshot(initialFilters: ApplicantFilterValues) {
  return {
    name: initialFilters.name || '',
    email: initialFilters.email || '',
    phone: initialFilters.phone || '',
    selectedPositionIds: initialFilters.selectedPositionIds || [],
    selectedStatuses: initialFilters.selectedStatuses || [],
    selectedSourceIds: initialFilters.selectedSourceIds || [],
    skills: initialFilters.skills || '',
    location: initialFilters.location || '',
    locationOperator: (initialFilters.locationOperator || 'contains') as ApplicantLocationOperator,
    minExperienceYears: initialFilters.minExperienceYears ?? 0,
    maxExperienceYears: initialFilters.maxExperienceYears || 50,
    applicationDateStart: initialFilters.applicationDateStart,
    applicationDateEnd: initialFilters.applicationDateEnd,
    selectedRecruiterIds: initialFilters.selectedRecruiterIds || [],
    customFieldFilters: initialFilters.customFieldFilters || {},
  };
}

export function areApplicantFilterSnapshotsEqual(
  current: ApplicantFilterSnapshotInput,
  incoming: ApplicantFilterValues
) {
  return JSON.stringify(buildCurrentFilterSnapshot(current)) === JSON.stringify(buildIncomingFilterSnapshot(incoming));
}
