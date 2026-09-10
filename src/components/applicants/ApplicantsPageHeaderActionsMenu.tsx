"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowDownTrayIcon as FileDown,
  Cog6ToothIcon as Settings,
  EllipsisVerticalIcon as MoreVertical,
  PlusCircleIcon as PlusCircle,
  TableCellsIcon as FileSpreadsheet,
} from '@heroicons/react/24/outline';

import { ApplicantGroupByControl } from './ApplicantGroupByControl';
import type { ApplicantGroupBy } from './applicant-settings-types';

type HeaderActionHandlers = {
  onAddApplicant: () => void;
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;
};

interface ApplicantsHeaderActionsMenuProps extends HeaderActionHandlers {
  disabled: boolean;
  exportImportFeatureEnabled: boolean;
  groupBy: ApplicantGroupBy;
  onGroupByChange: (groupBy: ApplicantGroupBy) => Promise<void>;
}

interface ApplicantsHeaderUploadButtonProps {
  disabled: boolean;
  onBulkUpload: () => void;
}

export function ApplicantsHeaderUploadButton({
  disabled,
  onBulkUpload,
}: ApplicantsHeaderUploadButtonProps) {
  return (
    <Button
      onClick={onBulkUpload}
      disabled={disabled}
      className="h-9 px-3"
    >
      Add resumes
    </Button>
  );
}

export function ApplicantsHeaderActionsMenu({
  disabled,
  exportImportFeatureEnabled,
  groupBy,
  onAddApplicant,
  onExport,
  onGroupByChange,
  onImport,
  onSettings,
}: ApplicantsHeaderActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled}
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg p-0 hover:bg-muted/60"
          aria-label="Applicant actions"
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="p-2">
          <ApplicantGroupByControl
            groupBy={groupBy}
            onGroupByChange={onGroupByChange}
            className="flex flex-col gap-2"
          />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddApplicant} className="py-2 text-sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add applicant
        </DropdownMenuItem>
        {exportImportFeatureEnabled ? (
          <>
            <DropdownMenuItem onClick={onExport} className="py-2 text-sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImport} className="py-2 text-sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import data
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem onClick={onSettings} className="py-2 text-sm">
          <Settings className="mr-2 h-4 w-4" />
          Applicant settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
