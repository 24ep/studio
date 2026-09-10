"use client";

import type { Dispatch, SetStateAction } from "react";

import { Accordion } from "@/components/ui/accordion";
import type { ApplicantCustomFieldFilterValue, CustomFieldDefinition } from "@/lib/types";
import {
  ApplicantMobileCustomFieldsSection,
  ApplicantMobileExperienceSection,
  ApplicantMobileInfoFilters,
  ApplicantMobilePipelineOptions,
} from "./ApplicantMobileFiltersPanelParts";
import type { ApplicantTextOperator } from "./ApplicantTextOperatorSelect";
import { type ApplicantFilterOption } from "./applicant-filter-query-utils";

type ApplicantMobileFiltersPanelProps = {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: Set<string>;
  nameOperator: ApplicantTextOperator;
  emailOperator: ApplicantTextOperator;
  phoneOperator: ApplicantTextOperator;
  selectedStatuses: Set<string>;
  selectedPositionIds: Set<string>;
  selectedRecruiterIds: Set<string>;
  selectedSourceIds: Set<string>;
  experienceYearsRange: [number, number];
  customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>;
  filterableCustomFields: CustomFieldDefinition[];
  expandedAttributes: Record<string, boolean>;
  stageOptions: ApplicantFilterOption[];
  positionOptions: ApplicantFilterOption[];
  recruiterOptions: ApplicantFilterOption[];
  sourceOptions: ApplicantFilterOption[];
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSkillsChange: Dispatch<SetStateAction<Set<string>>>;
  onNameOperatorChange: Dispatch<SetStateAction<ApplicantTextOperator>>;
  onEmailOperatorChange: Dispatch<SetStateAction<ApplicantTextOperator>>;
  onPhoneOperatorChange: Dispatch<SetStateAction<ApplicantTextOperator>>;
  onStatusesChange: Dispatch<SetStateAction<Set<string>>>;
  onPositionIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onRecruiterIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onSourceIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onExperienceYearsRangeChange: Dispatch<SetStateAction<[number, number]>>;
  onCustomFieldFiltersChange: Dispatch<SetStateAction<Record<string, ApplicantCustomFieldFilterValue>>>;
  onToggleSeeMore: (attributeKey: string) => void;
};

export function ApplicantMobileFiltersPanel({
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
}: ApplicantMobileFiltersPanelProps) {
  return (
    <div className="p-4 pb-24">
      <Accordion type="single" collapsible className="w-full space-y-2">
        <ApplicantMobileInfoFilters
          email={email}
          emailOperator={emailOperator}
          location={location}
          name={name}
          nameOperator={nameOperator}
          phone={phone}
          phoneOperator={phoneOperator}
          skills={skills}
          onEmailChange={onEmailChange}
          onEmailOperatorChange={onEmailOperatorChange}
          onLocationChange={onLocationChange}
          onNameChange={onNameChange}
          onNameOperatorChange={onNameOperatorChange}
          onPhoneChange={onPhoneChange}
          onPhoneOperatorChange={onPhoneOperatorChange}
          onSkillsChange={onSkillsChange}
        />
        <ApplicantMobilePipelineOptions
          expandedAttributes={expandedAttributes}
          positionOptions={positionOptions}
          recruiterOptions={recruiterOptions}
          selectedPositionIds={selectedPositionIds}
          selectedRecruiterIds={selectedRecruiterIds}
          selectedSourceIds={selectedSourceIds}
          selectedStatuses={selectedStatuses}
          sourceOptions={sourceOptions}
          stageOptions={stageOptions}
          onPositionIdsChange={onPositionIdsChange}
          onRecruiterIdsChange={onRecruiterIdsChange}
          onSourceIdsChange={onSourceIdsChange}
          onStatusesChange={onStatusesChange}
          onToggleSeeMore={onToggleSeeMore}
        />
        <ApplicantMobileExperienceSection
          experienceYearsRange={experienceYearsRange}
          onExperienceYearsRangeChange={onExperienceYearsRangeChange}
        />
        <ApplicantMobileCustomFieldsSection
          customFieldFilters={customFieldFilters}
          filterableCustomFields={filterableCustomFields}
          onCustomFieldFiltersChange={onCustomFieldFiltersChange}
        />
      </Accordion>
    </div>
  );
}
