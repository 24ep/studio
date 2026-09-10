"use client";

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Applicant } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ApplicantActionsCell,
  ApplicantAppliedDateCell,
  ApplicantExpectedSalaryCell,
  ApplicantFitScoreCell,
  ApplicantNameCell,
  ApplicantStatusCell,
} from './ApplicantsTableShared';

export function getUniqueEmailOrder(applicants: Applicant[]) {
  return applicants
    .map((applicant) => applicant.email)
    .filter((email, index, emailOrder): email is string => Boolean(email) && emailOrder.indexOf(email) === index);
}

function getAllApplicantRowClass(applicant: Applicant) {
  return cn('hover:bg-muted/50', applicant.isPinned && 'bg-primary/15 dark:bg-primary/25');
}

interface AllApplicantRowProps {
  applicant: Applicant;
  rowNumber: number;
  stageNames: Record<string, string>;
  onApplicantClick: (applicantId: string) => void;
  onPinToggle: (applicant: Applicant) => Promise<void>;
  showPin?: boolean;
}

interface GroupedApplicantRowsProps {
  email: string;
  applicants: Applicant[];
  isExpanded: boolean;
  startRowNumber: number;
  stageNames: Record<string, string>;
  onToggle: () => void;
  onApplicantClick: (applicantId: string) => void;
  onPinToggle: (applicant: Applicant) => Promise<void>;
}

export function AllApplicantRow({
  applicant,
  rowNumber,
  stageNames,
  onApplicantClick,
  onPinToggle,
  showPin = false,
}: AllApplicantRowProps) {
  return (
    <TableRow className={getAllApplicantRowClass(applicant)}>
      <TableCell className="text-center font-mono text-xs text-muted-foreground">{rowNumber}</TableCell>
      <ApplicantNameCell applicant={applicant} onApplicantClick={onApplicantClick} />
      <ApplicantFitScoreCell applicant={applicant} />
      <ApplicantExpectedSalaryCell applicant={applicant} />
      <ApplicantStatusCell applicant={applicant} stageNames={stageNames} />
      <ApplicantAppliedDateCell applicant={applicant} />
      <ApplicantActionsCell
        applicant={applicant}
        onApplicantClick={onApplicantClick}
        onPinToggle={onPinToggle}
        showPin={showPin}
      />
    </TableRow>
  );
}

export function GroupedApplicantRows({
  email,
  applicants,
  isExpanded,
  startRowNumber,
  stageNames,
  onToggle,
  onApplicantClick,
  onPinToggle,
}: GroupedApplicantRowsProps) {
  return (
    <React.Fragment key={email}>
      <TableRow className="bg-muted/30">
        <TableCell colSpan={99} className="p-0">
          <div className="flex items-center gap-2 px-2 py-1 bg-muted">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="border border-primary"
            >
              {isExpanded ? <ChevronDown /> : <ChevronUp />}
            </Button>
            <span className="font-semibold">{email}</span>
            <span className="text-xs text-muted-foreground">({applicants.length} Applicants)</span>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && applicants.map((applicant, index) => (
        <AllApplicantRow
          key={applicant.id}
          applicant={applicant}
          rowNumber={startRowNumber + index}
          stageNames={stageNames}
          onApplicantClick={onApplicantClick}
          onPinToggle={onPinToggle}
          showPin
        />
      ))}
    </React.Fragment>
  );
}
