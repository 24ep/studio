"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import ApplicantDetailView from './ApplicantDetailView';
import MobileApplicantDetailView from './MobileApplicantDetailView';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';

interface ApplicantDetailModalProps {
  applicantId: string;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ApplicantDetailModal({
  applicantId,
  open,
  onClose,
  onRefresh
}: ApplicantDetailModalProps) {
  const isMobile = useIsMobile();

  const { contentZIndex } = useDynamicZIndex(`applicant-detail-modal-${applicantId}`, 'modal');

  if (isMobile && open) {
    return (
      <div 
        className="fixed left-0 right-0 bottom-[3.5rem] top-0 bg-background flex flex-col w-full overflow-hidden"
        style={{ zIndex: contentZIndex }}
      >
        <MobileApplicantDetailView
          applicantId={applicantId}
          onClose={onClose}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent
        dialogId={`applicant-detail-modal-${applicantId}`}
        placement="right"
        overlayClassName="bg-slate-950/10 dark:bg-black/25"
        className="h-dvh w-[min(72rem,calc(100vw-1.5rem))] max-w-[72rem] gap-0 overflow-hidden rounded-none border-y-0 border-r-0 border-border bg-background p-0 shadow-[-12px_0_36px_-22px_rgba(15,27,52,0.45)] sm:rounded-l-md"
        hideCloseButton
        aria-describedby="applicant-review-drawer-description"
      >
        <VisuallyHidden>
          <DialogTitle>Applicant Details</DialogTitle>
          <DialogDescription id="applicant-review-drawer-description">
            Review applicant details, activity, evaluation, and hiring status.
          </DialogDescription>
        </VisuallyHidden>
        <div className="h-full min-h-0 w-full overflow-hidden">
          <ApplicantDetailView
            applicantId={applicantId}
            onClose={onClose}
            isModal={true}
            onRefresh={onRefresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

