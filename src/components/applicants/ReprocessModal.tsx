"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowPathIcon as Loader2, ArrowPathIcon as RefreshCw } from '@heroicons/react/24/outline';
import type { Position } from '@/lib/types';
import {
  ReprocessAttachmentSection,
  ReprocessPositionSection,
} from './ReprocessModalParts';
import { type ReprocessAttachment } from './reprocess-modal-utils';
import { useReprocessModal } from './use-reprocess-modal';

interface ReprocessModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId: string;
  applicantName: string;
  applicantPositionId?: string | null;
  applicantSourceId?: string | null;
  attachments: ReprocessAttachment[];
  positions: Position[];
}

export default function ReprocessModal({
  isOpen,
  onOpenChange,
  applicantId,
  applicantName,
  applicantPositionId,
  applicantSourceId,
  attachments,
  positions
}: ReprocessModalProps) {
  const modal = useReprocessModal({
    isOpen,
    onOpenChange,
    applicantId,
    applicantPositionId,
    applicantSourceId,
    attachments,
    positions,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dialogId="reprocess-modal">
        <DialogHeader>
          <DialogTitle>Re-process Attachment</DialogTitle>
          <DialogDescription>
            Re-process an attachment for applicant: <strong>{applicantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <ReprocessAttachmentSection
            selectedAttachment={modal.selectedAttachment}
            selectedAttachmentData={modal.selectedAttachmentData}
            validAttachments={modal.validAttachments}
            isPreviewLoading={modal.isPreviewLoading}
            iframeRef={modal.iframeRef}
            onAttachmentChange={modal.handleAttachmentChange}
            onPreviewLoad={modal.markPreviewLoaded}
            onPreviewError={modal.markPreviewFailed}
          />
          <ReprocessPositionSection
            selectedPositionId={modal.selectedPositionId}
            positionSearchTerm={modal.positionSearchTerm}
            filteredPositions={modal.filteredPositions}
            searchInputRef={modal.searchInputRef}
            onPositionChange={modal.setSelectedPositionId}
            onSearchChange={modal.setPositionSearchTerm}
            onSearchBlur={modal.refocusPositionSearch}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={modal.isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={modal.handleReprocess}
            disabled={!modal.selectedAttachment || !modal.selectedPositionId || modal.isProcessing || modal.validAttachments.length === 0}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {modal.isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding to Queue...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Add to Processing Queue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
