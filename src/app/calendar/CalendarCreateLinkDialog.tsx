'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  CalendarCreateLinkContent,
  CalendarCreateLinkSubmitContent,
} from './CalendarCreateLinkDialogParts';
import type { CalendarInterviewer, PositionValidation, SearchApplicant } from './calendar-page-utils';

interface CalendarCreateLinkDialogProps {
  availableInterviewers: CalendarInterviewer[];
  canCreateLink: boolean;
  expireDate: string;
  interviewDateTime: string;
  interviewLocation: string;
  isCreatingLink: boolean;
  isMobile: boolean;
  isOpen: boolean;
  isSearching: boolean;
  positionValidation: PositionValidation;
  requireLogin: boolean;
  searchQuery: string;
  searchResults: SearchApplicant[];
  selectedApplicant: SearchApplicant | null;
  selectedInterviewerIds: Set<string>;
  sendAppointment: boolean;
  showValidationWarning: boolean;
  onConfigurePosition: () => void;
  onCreateEvaluationLink: () => void;
  onOpenChange: (open: boolean) => void;
  onRequireLoginChange: (value: boolean) => void;
  onSearchQueryChange: (query: string) => void;
  onSelectApplicant: (applicant: SearchApplicant) => void;
  onSelectedApplicantChange: (applicant: SearchApplicant | null) => void;
  onSelectedInterviewerIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onSendAppointmentChange: (value: boolean) => void;
  setExpireDate: (value: string) => void;
  setInterviewDateTime: (value: string) => void;
  setInterviewLocation: (value: string) => void;
}

export function CalendarCreateLinkDialog({
  availableInterviewers,
  canCreateLink,
  expireDate,
  interviewDateTime,
  interviewLocation,
  isCreatingLink,
  isMobile,
  isOpen,
  isSearching,
  positionValidation,
  requireLogin,
  searchQuery,
  searchResults,
  selectedApplicant,
  selectedInterviewerIds,
  sendAppointment,
  showValidationWarning,
  onConfigurePosition,
  onCreateEvaluationLink,
  onOpenChange,
  onRequireLoginChange,
  onSearchQueryChange,
  onSelectApplicant,
  onSelectedApplicantChange,
  onSelectedInterviewerIdsChange,
  onSendAppointmentChange,
  setExpireDate,
  setInterviewDateTime,
  setInterviewLocation,
}: CalendarCreateLinkDialogProps) {
  const content = (
    <CalendarCreateLinkContent
      availableInterviewers={availableInterviewers}
      expireDate={expireDate}
      interviewDateTime={interviewDateTime}
      interviewLocation={interviewLocation}
      isSearching={isSearching}
      positionValidation={positionValidation}
      requireLogin={requireLogin}
      searchQuery={searchQuery}
      searchResults={searchResults}
      selectedApplicant={selectedApplicant}
      selectedInterviewerIds={selectedInterviewerIds}
      sendAppointment={sendAppointment}
      showValidationWarning={showValidationWarning}
      onConfigurePosition={onConfigurePosition}
      onRequireLoginChange={onRequireLoginChange}
      onSearchQueryChange={onSearchQueryChange}
      onSelectApplicant={onSelectApplicant}
      onSelectedApplicantChange={onSelectedApplicantChange}
      onSelectedInterviewerIdsChange={onSelectedInterviewerIdsChange}
      onSendAppointmentChange={onSendAppointmentChange}
      setExpireDate={setExpireDate}
      setInterviewDateTime={setInterviewDateTime}
      setInterviewLocation={setInterviewLocation}
    />
  );
  const submitButtonContent = <CalendarCreateLinkSubmitContent isCreatingLink={isCreatingLink} />;

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>New Interview Session</SheetTitle>
          </SheetHeader>
          {content}
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={onCreateEvaluationLink}
              disabled={!canCreateLink || isCreatingLink}
              className="w-full"
            >
              {submitButtonContent}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Interview Session</DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onCreateEvaluationLink}
            disabled={!canCreateLink || isCreatingLink}
          >
            {submitButtonContent}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
