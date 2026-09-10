import type { ComponentProps } from 'react';

import type { ApplicantSource } from '@/lib/types';

import { ApplicantFiltersView } from '../ApplicantFiltersView';
import {
  getTrimmedApplicantAiSearchQuery,
  removeApplicantQueryHistoryItem,
  toggleApplicantQueryHistoryVisibility,
} from '../applicant-filter-query-utils';
import type { useApplicantAdvancedQuery } from './use-applicant-advanced-query';
import type { useApplicantFilterApplyActions } from './use-applicant-filter-apply-actions';
import type { useApplicantFilterOptions } from './use-applicant-filter-options';
import type { useApplicantStandardFilterState } from './use-applicant-standard-filter-state';

type ApplicantFiltersViewProps = ComponentProps<typeof ApplicantFiltersView>;

export function buildApplicantFiltersDesktopProps({
  advanced,
  advancedQuery,
  applyActions,
  availableSources,
  isAiSearching,
  isLoading,
  onAiSearch,
  onCancelAiSearch,
  options,
  standard,
}: {
  advanced: ReturnType<typeof useApplicantAdvancedQuery>;
  advancedQuery?: string;
  applyActions: ReturnType<typeof useApplicantFilterApplyActions>;
  availableSources: ApplicantSource[];
  isAiSearching?: boolean;
  isLoading?: boolean;
  onAiSearch: (query: string) => void;
  onCancelAiSearch?: () => void;
  options: ReturnType<typeof useApplicantFilterOptions>;
  standard: ReturnType<typeof useApplicantStandardFilterState>;
}): Pick<ApplicantFiltersViewProps, 'desktopPanelProps' | 'advancedTabProps'> {
  const handleAiSearchClick = () => {
    const query = getTrimmedApplicantAiSearchQuery(standard.aiSearchQueryInput);
    if (query) {
      onAiSearch(query);
    }
  };

  return {
    desktopPanelProps: {
      isLoading,
      isAiSearching,
      isApplyingFilters: applyActions.isApplyingFilters,
      aiSearchQueryInput: standard.aiSearchQueryInput,
      name: standard.name,
      email: standard.email,
      phone: standard.phone,
      location: standard.location,
      nameOperator: standard.nameOperator,
      emailOperator: standard.emailOperator,
      phoneOperator: standard.phoneOperator,
      locationOperator: standard.locationOperator,
      skills: standard.skills,
      selectedPositionIds: standard.selectedPositionIds,
      selectedStatuses: standard.selectedStatuses,
      selectedRecruiterIds: standard.selectedRecruiterIds,
      selectedSourceIds: standard.selectedSourceIds,
      experienceYearsRange: standard.experienceYearsRange,
      customFieldFilters: standard.customFieldFilters,
      filterableCustomFields: options.filterableCustomFields,
      isLoadingCustomFields: options.isLoadingCustomFields,
      availableStages: options.safeAvailableStages,
      availableRecruiters: options.safeAvailableRecruiter,
      availableSources,
      onAiQueryChange: standard.setAiSearchQueryInput,
      onAiSearch: handleAiSearchClick,
      onCancelAiSearch,
      onReset: standard.resetFilters,
      onNameChange: standard.setName,
      onEmailChange: standard.setEmail,
      onPhoneChange: standard.setPhone,
      onLocationChange: standard.setLocation,
      onNameOperatorChange: standard.setNameOperator,
      onEmailOperatorChange: standard.setEmailOperator,
      onPhoneOperatorChange: standard.setPhoneOperator,
      onLocationOperatorChange: standard.setLocationOperator,
      onSkillsChange: standard.setSkills,
      onNameFocus: () => standard.setIsTypingName(true),
      onNameBlur: () => standard.setIsTypingName(false),
      onLocationFocus: () => standard.setIsTypingLocation(true),
      onLocationBlur: () => standard.setIsTypingLocation(false),
      onApply: applyActions.handleApplyStandardFilters,
      onScheduleSkillsApply: () => applyActions.scheduleSkillFilterApply(),
      onPositionChange: applyActions.handlePositionChange,
      onStatusChange: applyActions.handleStatusChange,
      onRecruiterChange: applyActions.handleRecruiterChange,
      onSourceChange: applyActions.handleSourceChange,
      onExperienceYearsRangeChange: applyActions.handleExperienceYearsChange,
      onNoExperienceToggle: applyActions.handleNoExperienceToggle,
      onCustomFieldFiltersChange: standard.setCustomFieldFilters,
      onScheduleApply: applyActions.scheduleStandardFilterApply,
    },
    advancedTabProps: {
      query: advanced.advancedQueryInput,
      advancedQuery,
      validationError: advanced.queryValidationError,
      queryHistory: advanced.queryHistory,
      showQueryHistory: advanced.showQueryHistory,
      onQueryChange: advanced.setAdvancedQueryInput,
      onValidationErrorChange: advanced.setQueryValidationError,
      onApplyQuery: advanced.handleApplyAdvancedQuery,
      onClear: advanced.handleClearAdvancedQuery,
      onOpenSyntax: () => advanced.setIsAdvancedQuerySyntaxModalOpen(true),
      onToggleQueryHistory: () => advanced.setShowQueryHistory(toggleApplicantQueryHistoryVisibility),
      onRemoveHistoryQuery: (index) => advanced.setQueryHistory(prev => removeApplicantQueryHistoryItem(prev, index)),
    },
  };
}
