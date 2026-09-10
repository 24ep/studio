"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { VisibleApplicantColumns } from './ApplicantsTabTypes';

interface ApplicantViewMenuProps {
  onVisibleColumnsChange: Dispatch<SetStateAction<VisibleApplicantColumns>>;
  visibleColumns: VisibleApplicantColumns;
}

const VISIBLE_COLUMN_OPTIONS: Array<{
  key: keyof VisibleApplicantColumns;
  label: string;
}> = [
  { key: 'name', label: 'Applicant' },
  { key: 'fitScore', label: 'Fit Score' },
  { key: 'expectedSalary', label: 'Expected Salary' },
  { key: 'status', label: 'Status' },
  { key: 'applicationDate', label: 'Applied Date' },
];

export function ApplicantViewMenu({
  onVisibleColumnsChange,
  visibleColumns,
}: ApplicantViewMenuProps) {
  const setColumnVisible = (column: keyof VisibleApplicantColumns, checked: boolean) => {
    onVisibleColumnsChange(prev => ({ ...prev, [column]: checked }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-10 lg:flex">
          <Settings2 className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {VISIBLE_COLUMN_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.key}
            checked={visibleColumns[option.key]}
            onCheckedChange={(checked) => setColumnVisible(option.key, checked === true)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
