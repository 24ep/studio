import { ApplicantAiPowerSearchSection } from './ApplicantAiPowerSearchSection';
import { ApplicantApplicationStatusFiltersSection } from './ApplicantApplicationStatusFiltersSection';
import { ApplicantDesktopExperienceFilterSection } from './ApplicantDesktopExperienceFilterSection';
import { ApplicantDesktopInfoFilterSection } from './ApplicantDesktopInfoFilterSection';
import {
  ApplicantDesktopCustomFieldsPanel,
  ApplicantDesktopFilterActionBar,
} from './ApplicantFiltersDesktopPanelParts';
import type { ApplicantFiltersDesktopPanelProps } from './ApplicantFiltersDesktopPanelTypes';

export function ApplicantFiltersDesktopPanel({
  isLoading,
  isAiSearching,
  isApplyingFilters,
  aiSearchQueryInput,
  name,
  email,
  phone,
  location,
  nameOperator,
  emailOperator,
  phoneOperator,
  locationOperator,
  skills,
  selectedPositionIds,
  selectedStatuses,
  selectedRecruiterIds,
  selectedSourceIds,
  experienceYearsRange,
  customFieldFilters,
  filterableCustomFields,
  isLoadingCustomFields,
  availableStages,
  availableRecruiters,
  availableSources,
  onAiQueryChange,
  onAiSearch,
  onCancelAiSearch,
  onReset,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onLocationChange,
  onNameOperatorChange,
  onEmailOperatorChange,
  onPhoneOperatorChange,
  onLocationOperatorChange,
  onSkillsChange,
  onNameFocus,
  onNameBlur,
  onLocationFocus,
  onLocationBlur,
  onApply,
  onScheduleSkillsApply,
  onPositionChange,
  onStatusChange,
  onRecruiterChange,
  onSourceChange,
  onExperienceYearsRangeChange,
  onNoExperienceToggle,
  onCustomFieldFiltersChange,
  onScheduleApply,
}: ApplicantFiltersDesktopPanelProps) {
  return (
    <div>
      <ApplicantAiPowerSearchSection
        query={aiSearchQueryInput}
        isLoading={isLoading}
        isAiSearching={isAiSearching}
        onQueryChange={onAiQueryChange}
        onSearch={onAiSearch}
        onCancelSearch={onCancelAiSearch}
        onReset={onReset}
      />

      <ApplicantDesktopInfoFilterSection
        isLoading={isLoading}
        isAiSearching={isAiSearching}
        name={name}
        email={email}
        phone={phone}
        location={location}
        nameOperator={nameOperator}
        emailOperator={emailOperator}
        phoneOperator={phoneOperator}
        locationOperator={locationOperator}
        skills={skills}
        onNameChange={onNameChange}
        onEmailChange={onEmailChange}
        onPhoneChange={onPhoneChange}
        onLocationChange={onLocationChange}
        onNameOperatorChange={onNameOperatorChange}
        onEmailOperatorChange={onEmailOperatorChange}
        onPhoneOperatorChange={onPhoneOperatorChange}
        onLocationOperatorChange={onLocationOperatorChange}
        onSkillsChange={onSkillsChange}
        onNameFocus={onNameFocus}
        onNameBlur={onNameBlur}
        onLocationFocus={onLocationFocus}
        onLocationBlur={onLocationBlur}
        onApply={onApply}
        onScheduleSkillsApply={onScheduleSkillsApply}
        onReset={onReset}
      />

      <ApplicantApplicationStatusFiltersSection
        isLoading={isLoading}
        isAiSearching={isAiSearching}
        isApplyingFilters={isApplyingFilters}
        selectedPositionIds={selectedPositionIds}
        selectedStatuses={selectedStatuses}
        selectedRecruiterIds={selectedRecruiterIds}
        selectedSourceIds={selectedSourceIds}
        availableStages={availableStages}
        availableRecruiters={availableRecruiters}
        availableSources={availableSources}
        onPositionChange={onPositionChange}
        onStatusChange={onStatusChange}
        onRecruiterChange={onRecruiterChange}
        onSourceChange={onSourceChange}
        onReset={onReset}
      />

      <ApplicantDesktopExperienceFilterSection
        isLoading={isLoading}
        isAiSearching={isAiSearching}
        range={experienceYearsRange}
        onRangeChange={onExperienceYearsRangeChange}
        onNoExperienceToggle={onNoExperienceToggle}
        onReset={onReset}
      />

      <ApplicantDesktopCustomFieldsPanel
        customFieldFilters={customFieldFilters}
        filterableCustomFields={filterableCustomFields}
        isAiSearching={isAiSearching}
        isLoading={isLoading}
        isLoadingCustomFields={isLoadingCustomFields}
        onCustomFieldFiltersChange={onCustomFieldFiltersChange}
        onScheduleApply={onScheduleApply}
      />

      <ApplicantDesktopFilterActionBar onApply={onApply} onReset={onReset} />
    </div>
  );
}
