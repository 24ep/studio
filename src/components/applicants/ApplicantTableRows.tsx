"use client";

import React from 'react';
import { UsersIcon as Users } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Applicant, ApplicantSource } from '@/lib/types';
import type { ApplicantSettings } from './applicant-settings-types';
import { ApplicantTableRow, getRowHeightStyle, getRowPaddingClass } from './ApplicantTableRow';
import {
  ApplicantTableActionsCell,
  ApplicantTableSelectCells,
} from './ApplicantTableRowChrome';
import { groupApplicantsByEmailForTable } from './applicant-page-utils';

interface ApplicantTableRowsProps {
  applicantList: Applicant[];
  startRowNumber: number;
  visibleColumnCount: number;
  settings?: ApplicantSettings;
  isJobMatchEnabled: boolean;
  availableRecruiter: { id: string; name: string }[];
  availableSources: ApplicantSource[];
  stageNames: Record<string, string>;
  stageColors: Record<string, string>;
  canEditApplicants: boolean;
  canDeleteApplicants: boolean;
  canViewDetailed: boolean;
  canAssignSource: boolean;
  assigningRecruiter: string | null;
  assigningSource: string | null;
  selectedApplicantIds: Set<string>;
  onAssignRecruiter: (applicantId: string, recruiterId: string | null) => Promise<void>;
  onAssignSource: (applicantId: string, sourceId: string | null, subSource?: string | null) => Promise<void>;
  onResetAssigning: () => void;
  onOpenDetail: (applicantId: string, applicantName: string) => void;
  onTogglePin: (applicant: Applicant) => Promise<void>;
  onToggleRead: (applicant: Applicant) => Promise<void>;
  onDelete: (applicant: Applicant) => void;
  onToggleSelectApplicant: (applicantId: string) => void;
}

export function ApplicantTableRows({
  applicantList,
  startRowNumber,
  visibleColumnCount,
  settings,
  isJobMatchEnabled,
  availableRecruiter,
  availableSources,
  stageNames,
  stageColors,
  canEditApplicants,
  canDeleteApplicants,
  canViewDetailed,
  canAssignSource,
  assigningRecruiter,
  assigningSource,
  selectedApplicantIds,
  onAssignRecruiter,
  onAssignSource,
  onResetAssigning,
  onOpenDetail,
  onTogglePin,
  onToggleRead,
  onDelete,
  onToggleSelectApplicant,
}: ApplicantTableRowsProps) {
  let rowNumber = startRowNumber;
  const { groupsByEmail, emailOrder } = groupApplicantsByEmailForTable(applicantList);

  const renderApplicantRow = (applicant: Applicant, currentRowNumber: number) => {
    const rowStyle = getRowHeightStyle(settings?.rowHeight);
    const rowPadding = getRowPaddingClass(settings?.rowHeight);

    return (
      <ApplicantTableRow
        key={applicant.id}
        applicant={applicant}
        settings={settings}
        isJobMatchEnabled={isJobMatchEnabled}
        availableRecruiter={availableRecruiter}
        availableSources={availableSources}
        stageNames={stageNames}
        stageColors={stageColors}
        canEditApplicants={canEditApplicants}
        canAssignSource={canAssignSource}
        assigningRecruiter={assigningRecruiter}
        assigningSource={assigningSource}
        onAssignRecruiter={onAssignRecruiter}
        onAssignSource={onAssignSource}
        onResetAssigning={onResetAssigning}
        onOpenDetail={onOpenDetail}
        togglePin={onTogglePin}
        rowHeightStyle={rowStyle}
        rowPaddingClass={rowPadding}
        prefixCells={
          <ApplicantTableSelectCells
            applicant={applicant}
            rowNumber={currentRowNumber}
            selectedApplicantIds={selectedApplicantIds}
            onToggleSelectApplicant={onToggleSelectApplicant}
          />
        }
        suffixCells={
          <ApplicantTableActionsCell
            applicant={applicant}
            canViewDetailed={canViewDetailed}
            canDeleteApplicants={canDeleteApplicants}
            onOpenDetail={onOpenDetail}
            onTogglePin={onTogglePin}
            onToggleRead={onToggleRead}
            onDelete={onDelete}
          />
        }
      />
    );
  };

  return (
    <>
      {emailOrder.map((email) => {
        const group = groupsByEmail[email];
        if (!group || group.length === 0) return null;

        if (group.length === 1) {
          return renderApplicantRow(group[0], rowNumber++);
        }

        return (
          <React.Fragment key={`group-${email}`}>
            <TableRow className="bg-muted/20 hover:bg-muted/30 transition-colors">
              <TableCell colSpan={visibleColumnCount}>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {group.length} duplicate{group.length > 1 ? 's' : ''}: {email}
                    </span>
                    <Badge variant="secondary" className="text-xs h-4 px-1">
                      {group.length}
                    </Badge>
                  </div>
                </div>
              </TableCell>
            </TableRow>

            {group.map((applicant) => renderApplicantRow(applicant, rowNumber++))}

            <TableRow className="bg-muted/10">
              <TableCell colSpan={visibleColumnCount} className="py-1" />
            </TableRow>
          </React.Fragment>
        );
      })}
    </>
  );
}
