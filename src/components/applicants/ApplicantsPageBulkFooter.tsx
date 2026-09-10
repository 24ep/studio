"use client";

import React from 'react';
import {
  ArrowPathIcon as RefreshCw,
  PencilSquareIcon as FileEdit,
  TrashIcon as Trash2,
  UsersIcon as Users,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';

interface ApplicantsPageBulkFooterProps {
  selectedApplicantIds: Set<string>;
  canDeleteApplicants: boolean;
  canBulkChangeStatus: boolean;
  canEditApplicants: boolean;
  onBulkDelete: (applicantIds: string[]) => Promise<void>;
  onBulkReprocess: (applicantIds: string[]) => Promise<void>;
  setSelectedApplicantIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setBulkNewStatus: React.Dispatch<React.SetStateAction<string>>;
  setBulkTransitionNotes: React.Dispatch<React.SetStateAction<string>>;
  setIsBulkStatusModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setBulkNewRecruiterId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsBulkRecruiterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ApplicantsPageBulkFooter({
  selectedApplicantIds,
  canDeleteApplicants,
  canBulkChangeStatus,
  canEditApplicants,
  onBulkDelete,
  onBulkReprocess,
  setSelectedApplicantIds,
  setBulkNewStatus,
  setBulkTransitionNotes,
  setIsBulkStatusModalOpen,
  setBulkNewRecruiterId,
  setIsBulkRecruiterModalOpen,
}: ApplicantsPageBulkFooterProps) {
  if (selectedApplicantIds.size === 0) {
    return null;
  }

  const selectedIds = Array.from(selectedApplicantIds);

  return (
    <div className="border-t bg-muted/30 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {selectedApplicantIds.size} Applicant{selectedApplicantIds.size !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-1">
            <Button
              onClick={() => onBulkDelete(selectedIds)}
              disabled={!canDeleteApplicants}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>

            <Button
              onClick={() => {
                setBulkNewStatus('');
                setBulkTransitionNotes('');
                setIsBulkStatusModalOpen(true);
              }}
              disabled={!canBulkChangeStatus}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              <FileEdit className="h-3 w-3 mr-1" />
              Status
            </Button>

            <Button
              onClick={() => {
                setBulkNewRecruiterId(null);
                setIsBulkRecruiterModalOpen(true);
              }}
              disabled={!canEditApplicants}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              <Users className="h-3 w-3 mr-1" />
              Recruiter
            </Button>

            <Button
              onClick={() => onBulkReprocess(selectedIds)}
              disabled={!canEditApplicants}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-process
            </Button>
          </div>
        </div>

        <Button
          onClick={() => setSelectedApplicantIds(new Set())}
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
