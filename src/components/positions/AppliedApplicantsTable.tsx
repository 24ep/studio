"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import type { Applicant } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ApplicantActionsCell,
  ApplicantAppliedDateCell,
  ApplicantExpectedSalaryCell,
  ApplicantFitScoreCell,
  ApplicantGroupHeader,
  ApplicantNameCell,
  ApplicantStatusCell,
  getAppliedApplicantRowClass,
  getVisibleColumnSpan,
  SortableApplicantHeader,
  splitPinnedApplicants,
  type PositionApplicantVisibleColumns,
} from './ApplicantsTableShared';

interface AppliedApplicantsTableProps {
  applicants: Applicant[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  openMenu: string | null;
  stageNames: Record<string, string>;
  onSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onOpenMenuChange: (menu: string | null) => void;
  onApplicantClick: (applicantId: string) => void;
  onPinToggle: (applicant: Applicant) => Promise<void>;
  visibleColumns?: PositionApplicantVisibleColumns;
}

const DEFAULT_VISIBLE_COLUMNS: Required<PositionApplicantVisibleColumns> = {
  name: true,
  fitScore: true,
  expectedSalary: true,
  status: true,
  applicationDate: true,
  actions: true,
};

export function AppliedApplicantsTable({
  applicants,
  sortColumn,
  sortDirection,
  openMenu,
  stageNames,
  onSort,
  onOpenMenuChange,
  onApplicantClick,
  onPinToggle,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
}: AppliedApplicantsTableProps) {
  if (applicants.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Applied Applicants</h3>
        <p className="text-muted-foreground">No applicants have applied to this position yet.</p>
      </div>
    );
  }

  const { pinned, unpinned } = splitPinnedApplicants(applicants);
  const visibleColumnSpan = getVisibleColumnSpan(visibleColumns);
  const sortState = {
    sortColumn,
    sortDirection,
    openMenu,
    onSort,
    onOpenMenuChange,
  };
  let rowNumber = 1;

  const renderApplicantRow = (applicant: Applicant) => (
    <TableRow
      key={applicant.id}
      className={cn('transition-colors group', getAppliedApplicantRowClass(applicant))}
    >
      <TableCell>{rowNumber++}</TableCell>
      {visibleColumns.name && (
        <ApplicantNameCell applicant={applicant} onApplicantClick={onApplicantClick} />
      )}
      {visibleColumns.fitScore && <ApplicantFitScoreCell applicant={applicant} />}
      {visibleColumns.expectedSalary && <ApplicantExpectedSalaryCell applicant={applicant} />}
      {visibleColumns.status && (
        <ApplicantStatusCell applicant={applicant} stageNames={stageNames} />
      )}
      {visibleColumns.applicationDate && <ApplicantAppliedDateCell applicant={applicant} />}
      {visibleColumns.actions && (
        <ApplicantActionsCell
          applicant={applicant}
          onApplicantClick={onApplicantClick}
          onPinToggle={onPinToggle}
        />
      )}
    </TableRow>
  );

  return (
    <Table containerClassName="overflow-visible">
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          {visibleColumns.name && <SortableApplicantHeader column="name" label="Applicant" {...sortState} />}
          {visibleColumns.fitScore && <SortableApplicantHeader column="fitScore" label="Fit Score" {...sortState} />}
          {visibleColumns.expectedSalary && <SortableApplicantHeader column="expectedSalary" label="Exp. Salary" {...sortState} />}
          {visibleColumns.status && <SortableApplicantHeader column="status" label="Status" {...sortState} />}
          {visibleColumns.applicationDate && <SortableApplicantHeader column="applicationDate" label="Applied Date" {...sortState} />}
          {visibleColumns.actions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {pinned.length > 0 && (
          <ApplicantGroupHeader
            label="Pinned Applicants"
            count={pinned.length}
            colSpan={visibleColumnSpan}
            pinned
          />
        )}
        {pinned.map(renderApplicantRow)}
        {unpinned.length > 0 && (
          <ApplicantGroupHeader
            label="All Applicants"
            count={unpinned.length}
            colSpan={visibleColumnSpan}
          />
        )}
        {unpinned.map(renderApplicantRow)}
      </TableBody>
    </Table>
  );
}
