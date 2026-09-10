import type { ComponentProps } from 'react';

import { ApplicantFiltersView } from '../ApplicantFiltersView';
import {
  removeApplicantQueryHistoryItem,
  toggleApplicantQueryHistoryVisibility,
} from '../applicant-filter-query-utils';
import type { useApplicantAdvancedQuery } from './use-applicant-advanced-query';
import type { useApplicantFilterApplyActions } from './use-applicant-filter-apply-actions';
import type { useApplicantFilterOptions } from './use-applicant-filter-options';
import type { useApplicantStandardFilterState } from './use-applicant-standard-filter-state';

type ApplicantFiltersViewProps = ComponentProps<typeof ApplicantFiltersView>;
type ApplicantFiltersMobileContentProps = NonNullable<ApplicantFiltersViewProps['mobileContentProps']>;

export function buildApplicantFiltersMobileContentProps({
  advanced,
  advancedQuery,
  className,
  hasActiveFilters,
  options,
  applyActions,
  standard,
}: {
  advanced: ReturnType<typeof useApplicantAdvancedQuery>;
  advancedQuery?: string;
  className?: string;
  hasActiveFilters: boolean;
  options: ReturnType<typeof useApplicantFilterOptions>;
  applyActions: ReturnType<typeof useApplicantFilterApplyActions>;
  standard: ReturnType<typeof useApplicantStandardFilterState>;
}): ApplicantFiltersMobileContentProps {
  return {
    activeTab: advanced.activeTab,
    className,
    name: standard.name,
    email: standard.email,
    phone: standard.phone,
    location: standard.location,
    skills: standard.skills,
    nameOperator: standard.nameOperator,
    emailOperator: standard.emailOperator,
    phoneOperator: standard.phoneOperator,
    selectedStatuses: standard.selectedStatuses,
    selectedPositionIds: standard.selectedPositionIds,
    selectedRecruiterIds: standard.selectedRecruiterIds,
    selectedSourceIds: standard.selectedSourceIds,
    experienceYearsRange: standard.experienceYearsRange,
    customFieldFilters: standard.customFieldFilters,
    filterableCustomFields: options.filterableCustomFields,
    expandedAttributes: standard.expandedAttributes,
    stageOptions: options.stageOptions,
    positionOptions: options.positionOptions,
    recruiterOptions: options.recruiterOptions,
    sourceOptions: options.sourceOptions,
    hasActiveFilters,
    advancedQueryInput: advanced.advancedQueryInput,
    advancedQuery,
    queryValidationError: advanced.queryValidationError,
    queryHistory: advanced.queryHistory,
    showQueryHistory: advanced.showQueryHistory,
    onTabChange: advanced.setActiveTab,
    onNameChange: standard.setName,
    onEmailChange: standard.setEmail,
    onPhoneChange: standard.setPhone,
    onLocationChange: standard.setLocation,
    onSkillsChange: standard.setSkills,
    onNameOperatorChange: standard.setNameOperator,
    onEmailOperatorChange: standard.setEmailOperator,
    onPhoneOperatorChange: standard.setPhoneOperator,
    onStatusesChange: standard.setSelectedStatuses,
    onPositionIdsChange: standard.setSelectedPositionIds,
    onRecruiterIdsChange: standard.setSelectedRecruiterIds,
    onSourceIdsChange: standard.setSelectedSourceIds,
    onExperienceYearsRangeChange: standard.setExperienceYearsRange,
    onCustomFieldFiltersChange: standard.setCustomFieldFilters,
    onToggleSeeMore: standard.toggleSeeMore,
    onApplyFilters: applyActions.handleApplyStandardFilters,
    onResetFilters: standard.resetFilters,
    onAdvancedQueryChange: advanced.setAdvancedQueryInput,
    onAdvancedValidationErrorChange: advanced.setQueryValidationError,
    onApplyAdvancedQuery: advanced.handleApplyAdvancedQuery,
    onClearAdvancedQuery: advanced.handleClearAdvancedQuery,
    onOpenAdvancedSyntax: () => advanced.setIsAdvancedQuerySyntaxModalOpen(true),
    onToggleQueryHistory: () => advanced.setShowQueryHistory(toggleApplicantQueryHistoryVisibility),
    onRemoveHistoryQuery: (index) => advanced.setQueryHistory(prev => removeApplicantQueryHistoryItem(prev, index)),
  };
}
