import type { MutableRefObject } from 'react';
import type { ApplicantFilterValues } from '@/lib/types';
import type { ApplicantFilterTimeoutRefs } from './use-applicant-filter-timeout-refs';

export type BuildCurrentStandardFilters = (
  overrides?: Partial<{ selectedPositionIds: Set<string> }>,
  options?: { preserveEmptyTextFilters?: boolean }
) => ApplicantFilterValues;

export interface ApplicantFilterTextFilters {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export type ApplicantFilterApplyRefs = Pick<ApplicantFilterTimeoutRefs,
  | 'multiselectTimeoutRef'
  | 'autoApplyTimeoutRef'
  | 'skillsTimeoutRef'
  | 'applyingFiltersTimeoutRef'
  | 'positionChangeTimeoutRef'
> & {
  isInitialLoadRef: MutableRefObject<boolean>;
  isSyncingFromInitialFiltersRef: MutableRefObject<boolean>;
  isComponentInitializedRef: MutableRefObject<boolean>;
  lastAppliedFiltersRef: MutableRefObject<string>;
};
