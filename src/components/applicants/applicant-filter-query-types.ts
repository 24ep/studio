import type { ApplicantFilterValues } from '../../lib/types';
import type { ApplicantFilterSnapshotInput } from './applicant-filter-sync-utils';

export interface StandardApplicantFilterInput extends ApplicantFilterSnapshotInput {
  nameOperator: NonNullable<ApplicantFilterValues['nameOperator']>;
  emailOperator: NonNullable<ApplicantFilterValues['emailOperator']>;
  phoneOperator: NonNullable<ApplicantFilterValues['phoneOperator']>;
}

export interface BuildStandardApplicantFiltersOptions {
  preserveEmptyTextFilters?: boolean;
}

export interface ApplicantStandardFilterApplyDecisionInput {
  filters: ApplicantFilterValues;
  lastAppliedFiltersKey: string;
  hasEmptyTextFilters: boolean;
}

export interface ApplicantFilterAutoApplyDecisionInput {
  isInitialLoad: boolean;
  isSyncingFromInitialFilters: boolean;
  isComponentInitialized: boolean;
  isHandlingPositionChange: boolean;
  isApplyingFilters: boolean;
  advancedQueryInput: string;
  autoApply: boolean;
  delayMs?: number;
}

export interface ApplicantPositionFilterApplyDecisionInput {
  now: number;
  lastPositionChangeTime: number;
  filters: ApplicantFilterValues;
  lastAppliedFiltersKey: string;
  throttleMs?: number;
}

export type ApplicantFilterCoreStateInput = Pick<StandardApplicantFilterInput,
  | 'name'
  | 'email'
  | 'phone'
  | 'selectedPositionIds'
  | 'selectedStatuses'
  | 'selectedSourceIds'
  | 'skills'
  | 'location'
  | 'locationOperator'
  | 'experienceYearsRange'
  | 'applicationDateRange'
  | 'selectedRecruiterIds'
  | 'customFieldFilters'
>;

export type ApplicantFilterStateSignalInput = ApplicantFilterCoreStateInput & Pick<StandardApplicantFilterInput,
  | 'nameOperator'
  | 'emailOperator'
  | 'phoneOperator'
>;

export type ApplicantStandardFilterApplyDecision =
  | {
      type: 'skip';
      nextLastAppliedFiltersKey: string;
      filters: null;
    }
  | {
      type: 'apply';
      nextLastAppliedFiltersKey: string;
      filters: ApplicantFilterValues;
    };

export type ApplicantFilterAutoApplyDecision =
  | { type: 'skip' }
  | { type: 'schedule'; delayMs: number };

export type ApplicantPositionFilterApplyDecision =
  | {
      type: 'skip-throttle';
      nextLastPositionChangeTime: number;
      nextLastAppliedFiltersKey: string;
      filters: null;
    }
  | {
      type: 'skip-duplicate';
      nextLastPositionChangeTime: number;
      nextLastAppliedFiltersKey: string;
      filters: null;
    }
  | {
      type: 'apply';
      nextLastPositionChangeTime: number;
      nextLastAppliedFiltersKey: string;
      filters: ApplicantFilterValues;
    };
