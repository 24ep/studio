"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  BriefcaseIcon as Briefcase,
  DocumentTextIcon as FileText,
  GlobeAltIcon as Globe,
  UserIcon as User,
  UsersIcon as Users,
} from "@heroicons/react/24/outline";

import { ApplicantFilterOptionsWithSeeMore } from "./ApplicantFilterOptionsWithSeeMore";
import { ApplicantMobileFilterSection } from "./ApplicantMobileFilterSection";
import { type ApplicantFilterOption, toggleStringSetItem } from "./applicant-filter-query-utils";

interface ApplicantMobileOptionsSectionProps {
  attributeKey: string;
  expandedAttributes: Record<string, boolean>;
  options: ApplicantFilterOption[];
  selectedIds: Set<string>;
  title: string;
  value: string;
  icon: typeof User;
  onSelectedIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onToggleSeeMore: (attributeKey: string) => void;
}

export function ApplicantMobilePipelineOptions({
  expandedAttributes,
  positionOptions,
  recruiterOptions,
  selectedPositionIds,
  selectedRecruiterIds,
  selectedSourceIds,
  selectedStatuses,
  sourceOptions,
  stageOptions,
  onPositionIdsChange,
  onRecruiterIdsChange,
  onSourceIdsChange,
  onStatusesChange,
  onToggleSeeMore,
}: {
  expandedAttributes: Record<string, boolean>;
  positionOptions: ApplicantFilterOption[];
  recruiterOptions: ApplicantFilterOption[];
  selectedPositionIds: Set<string>;
  selectedRecruiterIds: Set<string>;
  selectedSourceIds: Set<string>;
  selectedStatuses: Set<string>;
  sourceOptions: ApplicantFilterOption[];
  stageOptions: ApplicantFilterOption[];
  onPositionIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onRecruiterIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onSourceIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onStatusesChange: Dispatch<SetStateAction<Set<string>>>;
  onToggleSeeMore: (attributeKey: string) => void;
}) {
  return (
    <>
      <ApplicantMobileOptionsSection
        value="status"
        title="Recruitment Pipeline"
        icon={FileText}
        options={stageOptions}
        selectedIds={selectedStatuses}
        attributeKey="status"
        expandedAttributes={expandedAttributes}
        onSelectedIdsChange={onStatusesChange}
        onToggleSeeMore={onToggleSeeMore}
      />
      <ApplicantMobileOptionsSection
        value="positions"
        title="Positions"
        icon={Briefcase}
        options={positionOptions}
        selectedIds={selectedPositionIds}
        attributeKey="positions"
        expandedAttributes={expandedAttributes}
        onSelectedIdsChange={onPositionIdsChange}
        onToggleSeeMore={onToggleSeeMore}
      />
      <ApplicantMobileOptionsSection
        value="recruiters"
        title="Assigned Recruiters"
        icon={Users}
        options={recruiterOptions}
        selectedIds={selectedRecruiterIds}
        attributeKey="recruiters"
        expandedAttributes={expandedAttributes}
        onSelectedIdsChange={onRecruiterIdsChange}
        onToggleSeeMore={onToggleSeeMore}
      />
      <ApplicantMobileOptionsSection
        value="sources"
        title="Applicant Sources"
        icon={Globe}
        options={sourceOptions}
        selectedIds={selectedSourceIds}
        attributeKey="sources"
        expandedAttributes={expandedAttributes}
        onSelectedIdsChange={onSourceIdsChange}
        onToggleSeeMore={onToggleSeeMore}
      />
    </>
  );
}

function ApplicantMobileOptionsSection({
  attributeKey,
  expandedAttributes,
  icon,
  options,
  selectedIds,
  title,
  value,
  onSelectedIdsChange,
  onToggleSeeMore,
}: ApplicantMobileOptionsSectionProps) {
  return (
    <ApplicantMobileFilterSection value={value} title={title} icon={icon}>
      <ApplicantFilterOptionsWithSeeMore
        options={options}
        selectedIds={selectedIds}
        attributeKey={attributeKey}
        isExpanded={expandedAttributes[attributeKey] || false}
        onToggleOption={(id) => onSelectedIdsChange((prev) => toggleStringSetItem(prev, id))}
        onToggleExpanded={onToggleSeeMore}
      />
    </ApplicantMobileFilterSection>
  );
}
