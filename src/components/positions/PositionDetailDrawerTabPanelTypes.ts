import type { PositionDetailDrawerContentProps } from './PositionDetailDrawerContentTypes';

export type ApplicantsPanelProps = Pick<
  PositionDetailDrawerContentProps,
  | 'activeApplicantTab'
  | 'isMobile'
  | 'isJobMatchEnabled'
  | 'position'
  | 'appliedApplicants'
  | 'sortedAppliedApplicants'
  | 'appliedApplicantsSearchTerm'
  | 'appliedApplicantsSortColumn'
  | 'appliedApplicantsSortDirection'
  | 'appliedApplicantsOpenMenu'
  | 'appliedApplicantsPage'
  | 'appliedApplicantsPageSize'
  | 'appliedApplicantsTotal'
  | 'appliedApplicantsCount'
  | 'potentialApplicants'
  | 'sortedPotentialApplicants'
  | 'potentialApplicantsSearchTerm'
  | 'potentialApplicantsSortColumn'
  | 'potentialApplicantsSortDirection'
  | 'potentialApplicantsOpenMenu'
  | 'potentialApplicantsPage'
  | 'potentialApplicantsPageSize'
  | 'potentialApplicantsTotal'
  | 'applicantFilters'
  | 'isAiSearchingApplicants'
  | 'stageNames'
  | 'availableRecruiters'
  | 'availableSources'
  | 'recruitmentStages'
  | 'onActiveApplicantTabChange'
  | 'onAppliedApplicantsSearchChange'
  | 'onAppliedApplicantsSort'
  | 'onAppliedApplicantsOpenMenuChange'
  | 'onAppliedApplicantsPageChange'
  | 'onAppliedApplicantsPageSizeChange'
  | 'onAppliedApplicantPinToggle'
  | 'onPotentialApplicantsSearchChange'
  | 'onPotentialApplicantsSort'
  | 'onPotentialApplicantsOpenMenuChange'
  | 'onPotentialApplicantsPageChange'
  | 'onPotentialApplicantsPageSizeChange'
  | 'onPotentialApplicantPinToggle'
  | 'onApplicantClick'
  | 'onApplicantFilterChange'
  | 'onAiSearch'
  | 'onClearFilters'
>;

export type HeadcountPanelProps = Pick<
  PositionDetailDrawerContentProps,
  | 'isMobile'
  | 'isEditMode'
  | 'position'
  | 'positionId'
  | 'filteredApplicants'
  | 'onHeadcountChange'
  | 'onCustomFieldChange'
>;

export type InterviewerPanelProps = Pick<PositionDetailDrawerContentProps, 'isMobile' | 'position' | 'positionId'>;

export type EvaluationPanelProps = Pick<PositionDetailDrawerContentProps, 'position' | 'positionId'>;

export type MicrosoftAdPanelProps = Pick<
  PositionDetailDrawerContentProps,
  | 'isMobile'
  | 'position'
  | 'adUsers'
  | 'isLoadingAdUsers'
  | 'adUsersError'
  | 'onRetryAdUsers'
>;
