"use client";

import {
  ChevronRightIcon as ChevronRight,
  NoSymbolIcon as Ban,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  MobileApplicantFooterNoteField,
  MobileApplicantFooterPopoverActions,
  MobileApplicantFooterPopoverLayout,
} from './MobileApplicantFooterActionPopoverParts';

export interface MobileApplicantStage {
  id: string;
  name: string;
}

interface RejectApplicantPopoverProps {
  isOpen: boolean;
  isStatusUpdating: boolean;
  onNoteChange: (note: string) => void;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (statusId: string, notes?: string) => Promise<boolean>;
  rejectNote: string;
  rejectedStage: MobileApplicantStage;
}

interface NextStagePopoverProps {
  isOpen: boolean;
  isStatusUpdating: boolean;
  nextStage: MobileApplicantStage;
  onNoteChange: (note: string) => void;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (statusId: string, notes?: string) => Promise<boolean>;
  statusNote: string;
}

export function RejectApplicantPopover({
  isOpen,
  isStatusUpdating,
  onNoteChange,
  onOpenChange,
  onStatusUpdate,
  rejectNote,
  rejectedStage,
}: RejectApplicantPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={isStatusUpdating}
          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-11"
        >
          Reject
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] p-4 border-destructive/20 shadow-lg shadow-destructive/5" align="start" side="top" sideOffset={10}>
        <MobileApplicantFooterPopoverLayout
          title="Confirm Rejection"
          titleClassName="text-destructive"
          icon={<Ban className="h-4 w-4" />}
          description={(
            <p className="text-xs text-muted-foreground">
              Move applicant to <span className="font-semibold text-foreground">Reject</span> stage.
            </p>
          )}
          noteField={(
            <MobileApplicantFooterNoteField
              id="mobile-reject-note"
              label="REASON / NOTE (OPTIONAL)"
              note={rejectNote}
              onNoteChange={onNoteChange}
              placeholder="Add a reason for rejection..."
              toneClassName="focus:ring-destructive/20"
            />
          )}
          actions={(
            <MobileApplicantFooterPopoverActions
              cancelClassName="h-10 px-3 text-xs"
              confirmClassName="h-10 px-4 text-xs font-semibold"
              confirmLabel="Confirm Rejection"
              confirmSpinnerClassName="h-3 w-3"
              isStatusUpdating={isStatusUpdating}
              justifyClassName="justify-start"
              variant="destructive"
              onCancel={() => {
                onOpenChange(false);
                onNoteChange('');
              }}
              onConfirm={async () => {
                const result = await onStatusUpdate(rejectedStage.id, rejectNote);
                if (result) {
                  onNoteChange('');
                  onOpenChange(false);
                }
              }}
            />
          )}
        />
      </PopoverContent>
    </Popover>
  );
}

export function NextStagePopover({
  isOpen,
  isStatusUpdating,
  nextStage,
  onNoteChange,
  onOpenChange,
  onStatusUpdate,
  statusNote,
}: NextStagePopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          disabled={isStatusUpdating}
          className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all h-11"
        >
          {isStatusUpdating ? (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
          ) : (
            <>
              Move to {nextStage.name}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] p-4" align="end" side="top" sideOffset={10}>
        <MobileApplicantFooterPopoverLayout
          title="Confirm Next Step"
          titleClassName="text-foreground"
          description={(
            <p className="text-sm text-muted-foreground">
              Move applicant to <strong>{nextStage.name}</strong> stage.
            </p>
          )}
          noteField={(
            <MobileApplicantFooterNoteField
              id="mobile-footer-note"
              label="OPTIONAL NOTE"
              note={statusNote}
              onNoteChange={onNoteChange}
              placeholder="Add a note about this transition..."
              toneClassName="focus:ring-primary/20"
            />
          )}
          actions={(
            <MobileApplicantFooterPopoverActions
              cancelClassName="h-10 px-4 text-xs"
              confirmClassName="h-10 px-6 text-xs font-semibold"
              confirmLabel="Confirm"
              confirmSpinnerClassName="h-4 w-4"
              isStatusUpdating={isStatusUpdating}
              justifyClassName="justify-end"
              onCancel={() => {
                onOpenChange(false);
                onNoteChange('');
              }}
              onConfirm={async () => {
                const result = await onStatusUpdate(nextStage.id, statusNote);
                if (result) {
                  onNoteChange('');
                  onOpenChange(false);
                }
              }}
            />
          )}
        />
      </PopoverContent>
    </Popover>
  );
}
