"use client";

import { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import type { Applicant } from '@/lib/types';
import {
  AllApplicantRow,
  getUniqueEmailOrder,
  GroupedApplicantRows,
} from './AllApplicantsTableRows';
import {
  SortableApplicantHeader,
} from './ApplicantsTableShared';
import { AllApplicantsTableSearch } from './AllApplicantsTableSearch';

interface AllApplicantsTableProps {
  applicants: Applicant[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  openMenu: string | null;
  stageNames: Record<string, string>;
  onSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onOpenMenuChange: (menu: string | null) => void;
  onApplicantClick: (applicantId: string) => void;
  onPinToggle: (applicant: Applicant) => Promise<void>;
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AllApplicantsTable({
  applicants,
  searchTerm,
  onSearchChange,
  sortColumn,
  sortDirection,
  openMenu,
  stageNames,
  onSort,
  onOpenMenuChange,
  onApplicantClick,
  onPinToggle,
  total,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: AllApplicantsTableProps) {
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});
  const emailOrder = getUniqueEmailOrder(applicants);
  const sortState = {
    sortColumn,
    sortDirection,
    openMenu,
    onSort,
    onOpenMenuChange,
  };
  let rowNumber = 1;

  return (
    <div className="space-y-4">
      <AllApplicantsTableSearch searchTerm={searchTerm} onSearchChange={onSearchChange} />

      <div className="border rounded-lg">
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center">#</TableHead>
              <SortableApplicantHeader column="name" label="Applicant" {...sortState} />
              <SortableApplicantHeader column="fitScore" label="Fit Score" {...sortState} />
              <SortableApplicantHeader column="expectedSalary" label="Exp. Salary" {...sortState} />
              <SortableApplicantHeader column="status" label="Status" {...sortState} />
              <SortableApplicantHeader column="applicationDate" label="Applied Date" {...sortState} />
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emailOrder.map((email) => {
              const group = applicants.filter(applicant => applicant.email === email);
              if (group.length === 0) return null;

              if (group.length === 1) {
                const applicant = group[0];
                return (
                  <AllApplicantRow
                    key={applicant.id}
                    applicant={applicant}
                    rowNumber={rowNumber++}
                    stageNames={stageNames}
                    onApplicantClick={onApplicantClick}
                    onPinToggle={onPinToggle}
                  />
                );
              }

              const isExpanded = expandedEmails[email] ?? true;
              const startRowNumber = rowNumber;
              rowNumber += isExpanded ? group.length : 0;

              return (
                <GroupedApplicantRows
                  key={email}
                  email={email}
                  applicants={group}
                  isExpanded={isExpanded}
                  startRowNumber={startRowNumber}
                  stageNames={stageNames}
                  onToggle={() => setExpandedEmails((previous) => ({ ...previous, [email]: !isExpanded }))}
                  onApplicantClick={onApplicantClick}
                  onPinToggle={onPinToggle}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
