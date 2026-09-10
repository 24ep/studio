"use client";

import { DocumentTextIcon as FileText } from "@heroicons/react/24/outline";

import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ApplicantSource, RecruitmentStage, UserProfile } from "@/lib/types";

import { ApplicantFilterApplyingIndicator } from "./ApplicantFilterApplyingIndicator";
import { ApplicantFilterSectionHeader } from "./ApplicantFilterSectionHeader";
import { PositionMultiSelectDropdown } from "./PositionMultiSelectDropdown";
import { RecruiterMultiSelectDropdown } from "./RecruiterMultiSelectDropdown";
import { SourceMultiSelectDropdown } from "./SourceMultiSelectDropdown";
import { StatusMultiSelectDropdown } from "./StatusMultiSelectDropdown";

interface ApplicantApplicationStatusFiltersSectionProps {
  isLoading?: boolean;
  isAiSearching?: boolean;
  isApplyingFilters: boolean;
  selectedPositionIds: Set<string>;
  selectedStatuses: Set<string>;
  selectedRecruiterIds: Set<string>;
  selectedSourceIds: Set<string>;
  availableStages: RecruitmentStage[];
  availableRecruiters: Pick<UserProfile, "id" | "name">[];
  availableSources: ApplicantSource[];
  onPositionChange: (selectedIds: Set<string>) => void;
  onStatusChange: (selectedIds: Set<string>) => void;
  onRecruiterChange: (selectedIds: Set<string>) => void;
  onSourceChange: (selectedIds: Set<string>) => void;
  onReset: () => void;
}

export function ApplicantApplicationStatusFiltersSection({
  isLoading,
  isAiSearching,
  isApplyingFilters,
  selectedPositionIds,
  selectedStatuses,
  selectedRecruiterIds,
  selectedSourceIds,
  availableStages,
  availableRecruiters,
  availableSources,
  onPositionChange,
  onStatusChange,
  onRecruiterChange,
  onSourceChange,
  onReset,
}: ApplicantApplicationStatusFiltersSectionProps) {
  const isDisabled = isLoading || isAiSearching || isApplyingFilters;

  return (
    <Accordion type="multiple" defaultValue={["application-status"]} className="w-full">
      <AccordionItem value="application-status" className="border-b border-border/50">
        <AccordionTrigger className="px-6 py-3 hover:no-underline rounded-none pl-6 pr-6">
          <ApplicantFilterSectionHeader
            icon={<FileText className="w-4 h-4 text-muted-foreground" />}
            title="Application Status"
            onReset={onReset}
            disabled={isLoading || isAiSearching}
          />
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="position-select" className="text-xs">Position(s)</Label>
              <div className="w-full min-w-full">
                <PositionMultiSelectDropdown
                  selectedIds={selectedPositionIds}
                  onSelectionChange={onPositionChange}
                  placeholder="All positions..."
                  disabled={isDisabled}
                  showOpenStatus
                  filterOpenOnly={false}
                  showUnassignedOption
                />
              </div>
              {isApplyingFilters && <ApplicantFilterApplyingIndicator />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-select" className="text-xs">Recruitment Pipeline</Label>
              {availableStages.length === 0 ? (
                <div className="p-2 border bg-muted/20">
                  <span className="text-xs text-muted-foreground">No pipeline stages available</span>
                </div>
              ) : (
                <div className="w-full min-w-full">
                  <StatusMultiSelectDropdown
                    selectedIds={selectedStatuses}
                    onSelectionChange={onStatusChange}
                    placeholder="All stages..."
                    disabled={isDisabled}
                    stages={availableStages}
                  />
                </div>
              )}
              {isApplyingFilters && <ApplicantFilterApplyingIndicator />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-select" className="text-xs">Assigned Recruiter(s)</Label>
              {availableRecruiters.length === 0 ? (
                <div className="p-2 border bg-muted/20">
                  <span className="text-xs text-muted-foreground">No recruiters available</span>
                </div>
              ) : (
                <div className="w-full min-w-full">
                  <RecruiterMultiSelectDropdown
                    selectedIds={selectedRecruiterIds}
                    onSelectionChange={onRecruiterChange}
                    placeholder="All recruiters..."
                    disabled={isDisabled}
                    recruiters={availableRecruiters}
                  />
                </div>
              )}
              {isApplyingFilters && <ApplicantFilterApplyingIndicator />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-select" className="text-xs">Applicant Source(s)</Label>
              <div className="w-full min-w-full">
                <SourceMultiSelectDropdown
                  selectedSourceIds={selectedSourceIds}
                  onSelectionChange={onSourceChange}
                  placeholder="All sources..."
                  disabled={false}
                  availableSources={availableSources}
                />
              </div>
              {isApplyingFilters && <ApplicantFilterApplyingIndicator />}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
