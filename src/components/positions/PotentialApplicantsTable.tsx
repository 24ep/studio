"use client";

import { Search } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Applicant } from '@/lib/types';
import { cn } from '@/lib/utils';

import {
  ApplicantActionsCell,
  ApplicantFitScoreCell,
  ApplicantNameCell,
  ApplicantStatusCell,
  getAppliedApplicantRowClass,
  SortableApplicantHeader,
} from './ApplicantsTableShared';

interface PotentialApplicantsTableProps {
  applicants: Applicant[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  openMenu: string | null;
  stageNames: Record<string, string>;
  onSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onOpenMenuChange: (menu: string | null) => void;
  onApplicantClick: (applicantId: string) => void;
  onPinToggle: (applicant: Applicant) => Promise<void>;
}

export function PotentialApplicantsTable({
  applicants,
  sortColumn,
  sortDirection,
  openMenu,
  stageNames,
  onSort,
  onOpenMenuChange,
  onApplicantClick,
  onPinToggle,
}: PotentialApplicantsTableProps) {
  if (applicants.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Job Matches Found</h3>
        <p className="text-muted-foreground">No applicants with job matches for this position who haven't applied yet.</p>
      </div>
    );
  }

  const sortState = {
    sortColumn,
    sortDirection,
    openMenu,
    onSort,
    onOpenMenuChange,
  };
  let rowNumber = 1;

  return (
    <Table containerClassName="overflow-visible">
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <SortableApplicantHeader column="name" label="Applicant" {...sortState} />
          <SortableApplicantHeader column="fitScore" label="Fit Score" {...sortState} />
          <SortableApplicantHeader column="status" label="Status" {...sortState} />
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applicants.map(applicant => (
          <TableRow
            key={applicant.id}
            className={cn('transition-colors group', getAppliedApplicantRowClass(applicant))}
          >
            <TableCell>{rowNumber++}</TableCell>
            <ApplicantNameCell applicant={applicant} onApplicantClick={onApplicantClick} />
            <ApplicantFitScoreCell applicant={applicant} />
            <ApplicantStatusCell applicant={applicant} stageNames={stageNames} />
            <ApplicantActionsCell
              applicant={applicant}
              onApplicantClick={onApplicantClick}
              onPinToggle={onPinToggle}
            />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
