'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Loader2 } from 'lucide-react';
import {
  shouldShowCalendarSchedulingOptions,
  type CalendarInterviewer,
  type PositionValidation,
  type SearchApplicant,
} from './calendar-page-utils';
import {
  ApplicantSearchSection,
  ApplicantSummary,
  PositionValidationWarning,
} from './CalendarCreateLinkApplicantParts';
import { SchedulingOptions } from './CalendarCreateLinkSchedulingParts';

export interface CalendarCreateLinkContentProps {
  availableInterviewers: CalendarInterviewer[];
  expireDate: string;
  interviewDateTime: string;
  interviewLocation: string;
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

export function CalendarCreateLinkContent({
  availableInterviewers,
  expireDate,
  interviewDateTime,
  interviewLocation,
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
  onRequireLoginChange,
  onSearchQueryChange,
  onSelectApplicant,
  onSelectedApplicantChange,
  onSelectedInterviewerIdsChange,
  onSendAppointmentChange,
  setExpireDate,
  setInterviewDateTime,
  setInterviewLocation,
}: CalendarCreateLinkContentProps) {
  const showSchedulingOptions = shouldShowCalendarSchedulingOptions({
    selectedApplicant,
    positionValidation,
  });

  return (
    <div className="space-y-4 py-4">
      <ApplicantSearchSection
        isSearching={isSearching}
        searchQuery={searchQuery}
        searchResults={searchResults}
        selectedApplicant={selectedApplicant}
        onSearchQueryChange={onSearchQueryChange}
        onSelectApplicant={onSelectApplicant}
      />

      {selectedApplicant && (
        <ApplicantSummary
          applicant={selectedApplicant}
          onClear={() => {
            onSelectedApplicantChange(null);
            onSearchQueryChange('');
          }}
        />
      )}

      {selectedApplicant && positionValidation.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking position configuration...
        </div>
      )}

      {showValidationWarning && (
        <PositionValidationWarning
          positionValidation={positionValidation}
          onConfigurePosition={onConfigurePosition}
        />
      )}

      {showSchedulingOptions && selectedApplicant && (
        <SchedulingOptions
          availableInterviewers={availableInterviewers}
          expireDate={expireDate}
          interviewDateTime={interviewDateTime}
          interviewLocation={interviewLocation}
          positionValidation={positionValidation}
          requireLogin={requireLogin}
          selectedApplicant={selectedApplicant}
          selectedInterviewerIds={selectedInterviewerIds}
          sendAppointment={sendAppointment}
          onRequireLoginChange={onRequireLoginChange}
          onSelectedInterviewerIdsChange={onSelectedInterviewerIdsChange}
          onSendAppointmentChange={onSendAppointmentChange}
          setExpireDate={setExpireDate}
          setInterviewDateTime={setInterviewDateTime}
          setInterviewLocation={setInterviewLocation}
        />
      )}
    </div>
  );
}

export function CalendarCreateLinkSubmitContent({ isCreatingLink }: { isCreatingLink: boolean }) {
  if (!isCreatingLink) {
    return 'New Interview Session';
  }

  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Creating...
    </>
  );
}
