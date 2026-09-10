import {
  FunnelIcon as Filter,
  FunnelIcon as FilterX,
} from '@heroicons/react/24/outline';

import { ApplicantFilterActionBar } from './ApplicantFilterActionBar';
import { ApplicantMobileFiltersPanel } from './ApplicantMobileFiltersPanel';
import type { ApplicantFiltersMobileContentProps } from './ApplicantFiltersMobileContentTypes';

export function ApplicantFiltersMobileStandardPanel({
  activeTab,
  name,
  email,
  phone,
  location,
  skills,
  nameOperator,
  emailOperator,
  phoneOperator,
  selectedStatuses,
  selectedPositionIds,
  selectedRecruiterIds,
  selectedSourceIds,
  experienceYearsRange,
  customFieldFilters,
  filterableCustomFields,
  expandedAttributes,
  stageOptions,
  positionOptions,
  recruiterOptions,
  sourceOptions,
  hasActiveFilters,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onLocationChange,
  onSkillsChange,
  onNameOperatorChange,
  onEmailOperatorChange,
  onPhoneOperatorChange,
  onStatusesChange,
  onPositionIdsChange,
  onRecruiterIdsChange,
  onSourceIdsChange,
  onExperienceYearsRangeChange,
  onCustomFieldFiltersChange,
  onToggleSeeMore,
  onApplyFilters,
  onResetFilters,
}: ApplicantFiltersMobileContentProps) {
  if (activeTab !== 'filters') {
    return null;
  }

  return (
    <>
      <ApplicantMobileFiltersPanel
        name={name}
        email={email}
        phone={phone}
        location={location}
        skills={skills}
        nameOperator={nameOperator}
        emailOperator={emailOperator}
        phoneOperator={phoneOperator}
        selectedStatuses={selectedStatuses}
        selectedPositionIds={selectedPositionIds}
        selectedRecruiterIds={selectedRecruiterIds}
        selectedSourceIds={selectedSourceIds}
        experienceYearsRange={experienceYearsRange}
        customFieldFilters={customFieldFilters}
        filterableCustomFields={filterableCustomFields}
        expandedAttributes={expandedAttributes}
        stageOptions={stageOptions}
        positionOptions={positionOptions}
        recruiterOptions={recruiterOptions}
        sourceOptions={sourceOptions}
        onNameChange={onNameChange}
        onEmailChange={onEmailChange}
        onPhoneChange={onPhoneChange}
        onLocationChange={onLocationChange}
        onSkillsChange={onSkillsChange}
        onNameOperatorChange={onNameOperatorChange}
        onEmailOperatorChange={onEmailOperatorChange}
        onPhoneOperatorChange={onPhoneOperatorChange}
        onStatusesChange={onStatusesChange}
        onPositionIdsChange={onPositionIdsChange}
        onRecruiterIdsChange={onRecruiterIdsChange}
        onSourceIdsChange={onSourceIdsChange}
        onExperienceYearsRangeChange={onExperienceYearsRangeChange}
        onCustomFieldFiltersChange={onCustomFieldFiltersChange}
        onToggleSeeMore={onToggleSeeMore}
      />

      {hasActiveFilters && (
        <ApplicantFilterActionBar
          primaryLabel="Apply Filters"
          secondaryLabel="Clear All"
          onPrimary={onApplyFilters}
          onSecondary={onResetFilters}
          primaryIcon={Filter}
          secondaryIcon={FilterX}
          stickyMobile
        />
      )}
    </>
  );
}
