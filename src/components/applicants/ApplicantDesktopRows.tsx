"use client";

import React from 'react';
import type { ReactNode } from 'react';
import { UsersIcon as Users } from '@heroicons/react/24/outline';
import { Pin as PinIcon } from 'lucide-react';

import { TableCell, TableRow } from '@/components/ui/table';
import type { Applicant, Position } from '@/lib/types';

import type { ApplicantSettings } from './applicant-settings-types';
import type { ApplicantGroupBy } from './applicant-settings-types';
import { groupApplicantsForApplicantPage } from './applicant-grouping-utils';
import { getRowHeightStyle, getRowPaddingClass } from './ApplicantTableRow';

interface ApplicantDesktopRowsProps {
  applicants: Applicant[];
  applicantsByPinStatus: { pinned: Applicant[]; unpinned: Applicant[] };
  availablePositions: Position[];
  availableRecruiter: Array<{ id: string; name: string }>;
  baseIndex: number;
  groupBy: ApplicantGroupBy;
  renderApplicantRows: (applicants: Applicant[], startRowNumber: number) => ReactNode;
  settings?: ApplicantSettings;
  stageNames: Record<string, string>;
  visibleColumnCount: number;
}

export function ApplicantDesktopRows({
  applicants,
  applicantsByPinStatus,
  availablePositions,
  availableRecruiter,
  baseIndex,
  groupBy,
  renderApplicantRows,
  settings,
  stageNames,
  visibleColumnCount,
}: ApplicantDesktopRowsProps) {
  const { pinned, unpinned } = applicantsByPinStatus;
  const renderGroupedRows = (
    applicantList: Applicant[],
    startRowNumber: number,
    options: { hideGroupHeader?: boolean } = {}
  ) => {
    if (groupBy === 'none') {
      return renderApplicantRows(applicantList, startRowNumber);
    }

    let nextRowNumber = startRowNumber;
    const groups = groupApplicantsForApplicantPage({
      applicants: applicantList,
      availablePositions,
      availableRecruiter,
      groupBy,
      stageNames,
    });

    return (
      <>
        {groups.map((group) => {
          const groupRows = renderApplicantRows(group.applicants, nextRowNumber);
          nextRowNumber += group.applicants.length;

          return (
            <React.Fragment key={group.key}>
              {!options.hideGroupHeader && (
                <TableRow
                  className={`bg-muted/25 border-b border-muted ${getRowPaddingClass(settings?.rowHeight)}`}
                  style={getRowHeightStyle(settings?.rowHeight)}
                >
                  <TableCell colSpan={visibleColumnCount} className="px-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{group.label}</span>
                      <span className="text-sm text-muted-foreground">
                        ({group.applicants.length} applicant{group.applicants.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {groupRows}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  if (!settings?.showPinSection) {
    return <>{renderGroupedRows(applicants, baseIndex + 1)}</>;
  }

  return (
    <>
      {pinned.length > 0 && (
        <>
          <TableRow className={`bg-primary/15 dark:bg-primary/25 border-b-2 border-primary/30 ${getRowPaddingClass(settings?.rowHeight)}`}>
            <TableCell colSpan={visibleColumnCount} className="px-4">
              <div className="flex items-center gap-2">
                <PinIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">Pinned Applicants</span>
                <span className="text-sm text-muted-foreground">
                  ({pinned.length} applicant{pinned.length !== 1 ? 's' : ''})
                </span>
              </div>
            </TableCell>
          </TableRow>
          {renderGroupedRows(pinned, 1)}
        </>
      )}

      {unpinned.length > 0 && (
        <>
          <TableRow
            className={`bg-muted/30 border-b border-muted ${getRowPaddingClass(settings?.rowHeight)}`}
            style={getRowHeightStyle(settings?.rowHeight)}
          >
            <TableCell colSpan={visibleColumnCount} className="px-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">All Applicants</span>
                <span className="text-sm text-muted-foreground">
                  ({unpinned.length} applicant{unpinned.length !== 1 ? 's' : ''})
                </span>
              </div>
            </TableCell>
          </TableRow>
          {renderGroupedRows(unpinned, baseIndex + 1)}
        </>
      )}

      {pinned.length === 0 && unpinned.length === 0 && (
        <TableRow>
          <TableCell colSpan={visibleColumnCount} className="text-center py-8 text-muted-foreground">
            No applicants found
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
