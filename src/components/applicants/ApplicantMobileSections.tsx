"use client";

import type { MouseEvent } from 'react';
import { UsersIcon as Users } from '@heroicons/react/24/outline';
import { Pin as PinIcon } from 'lucide-react';

import type { Applicant, Position } from '@/lib/types';

import { ApplicantsMobileListView } from './ApplicantsMobileListView';
import type { ApplicantSettings } from './applicant-settings-types';
import type { ApplicantGroupBy } from './applicant-settings-types';
import { groupApplicantsForApplicantPage } from './applicant-grouping-utils';

interface ApplicantMobileSectionsProps {
  allApplicants: Applicant[];
  allDbPositions: Position[];
  applicantsByPinStatus: { pinned: Applicant[]; unpinned: Applicant[] };
  availableRecruiter: Array<{ id: string; name: string }>;
  baseIndex: number;
  groupBy: ApplicantGroupBy;
  onApplicantClick: (applicant: Applicant, event: MouseEvent) => void;
  onToggleSelectApplicant: (applicantId: string) => void;
  selectedApplicantIds: Set<string>;
  settings?: ApplicantSettings;
  stageColors: Record<string, string>;
  stageNames: Record<string, string>;
}

export function ApplicantMobileSections({
  allApplicants,
  allDbPositions,
  applicantsByPinStatus,
  availableRecruiter,
  baseIndex,
  groupBy,
  onApplicantClick,
  onToggleSelectApplicant,
  selectedApplicantIds,
  settings,
  stageColors,
  stageNames,
}: ApplicantMobileSectionsProps) {
  const { pinned, unpinned } = applicantsByPinStatus;
  const showPinSection = settings?.showPinSection;
  const displayedApplicants = showPinSection ? unpinned : allApplicants;
  const displayedBaseIndex = showPinSection ? pinned.length : baseIndex;
  const renderGroupedMobileList = (applicants: Applicant[], groupBaseIndex: number) => {
    if (groupBy === 'none') {
      return (
        <ApplicantsMobileListView
          applicants={applicants}
          selectedApplicantIds={selectedApplicantIds}
          onToggleSelectApplicant={onToggleSelectApplicant}
          onApplicantClick={onApplicantClick}
          stageNames={stageNames}
          stageColors={stageColors}
          baseIndex={groupBaseIndex}
          allDbPositions={allDbPositions}
        />
      );
    }

    let nextBaseIndex = groupBaseIndex;
    const groups = groupApplicantsForApplicantPage({
      applicants,
      availablePositions: allDbPositions,
      availableRecruiter,
      groupBy,
      stageNames,
    });

    return groups.map((group) => {
      const currentBaseIndex = nextBaseIndex;
      nextBaseIndex += group.applicants.length;

      return (
        <div key={group.key}>
          <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">{group.label}</h3>
            <span className="text-xs text-muted-foreground">({group.applicants.length})</span>
          </div>
          <ApplicantsMobileListView
            applicants={group.applicants}
            selectedApplicantIds={selectedApplicantIds}
            onToggleSelectApplicant={onToggleSelectApplicant}
            onApplicantClick={onApplicantClick}
            stageNames={stageNames}
            stageColors={stageColors}
            baseIndex={currentBaseIndex}
            allDbPositions={allDbPositions}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '100%' }}>
      {showPinSection && pinned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
            <PinIcon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-primary text-sm">Pinned Applicants</h3>
            <span className="text-xs text-muted-foreground">({pinned.length})</span>
          </div>
          {renderGroupedMobileList(pinned, 0)}
        </div>
      )}

      <div>
        {showPinSection && unpinned.length > 0 && (
          <div className="hidden items-center gap-2 px-4 py-2 bg-muted/30 border-t">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">All Applicants</h3>
            <span className="text-xs text-muted-foreground">({unpinned.length})</span>
          </div>
        )}
        {renderGroupedMobileList(displayedApplicants, displayedBaseIndex)}
      </div>
    </div>
  );
}
