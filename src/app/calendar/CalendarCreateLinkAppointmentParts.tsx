'use client';

import type { Dispatch, SetStateAction } from 'react';
import { AlertTriangle, Plus, Users } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { sanitizeUrl } from '@/lib/utils';
import {
  getCalendarPositionConfigurationUrl,
  toggleCalendarInterviewerSelection,
  type CalendarInterviewer,
  type PositionValidation,
  type SearchApplicant,
} from './calendar-page-utils';
import { ApplicantSummary } from './CalendarCreateLinkApplicantParts';

interface AppointmentSectionProps {
  availableInterviewers: CalendarInterviewer[];
  positionValidation: PositionValidation;
  selectedApplicant: SearchApplicant;
  selectedInterviewerIds: Set<string>;
  sendAppointment: boolean;
  onSelectedInterviewerIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onSendAppointmentChange: (value: boolean) => void;
}

export function AppointmentSection({
  availableInterviewers,
  positionValidation,
  selectedApplicant,
  selectedInterviewerIds,
  sendAppointment,
  onSelectedInterviewerIdsChange,
  onSendAppointmentChange,
}: AppointmentSectionProps) {
  const openPosition = () => {
    const positionUrl = getCalendarPositionConfigurationUrl(positionValidation.positionId);
    const safeUrl = positionUrl ? sanitizeUrl(positionUrl) : null;

    if (safeUrl) {
      window.open(safeUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="sendAppointment" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Send Interview Appointment
        </Label>
        <Switch
          id="sendAppointment"
          checked={sendAppointment}
          onCheckedChange={onSendAppointmentChange}
        />
      </div>

      {sendAppointment && (
        <div className="space-y-4 border-t pt-2">
          <ApplicantSummary applicant={selectedApplicant} label="Applicant" showPosition={false} />

          <InterviewerSelectionList
            availableInterviewers={availableInterviewers}
            selectedInterviewerIds={selectedInterviewerIds}
            onSelectedInterviewerIdsChange={onSelectedInterviewerIdsChange}
            onInviteMoreInterviewers={openPosition}
          />

          {selectedInterviewerIds.size === 0 && <MissingInterviewerAlert />}
        </div>
      )}
    </div>
  );
}

function InterviewerSelectionList({
  availableInterviewers,
  selectedInterviewerIds,
  onSelectedInterviewerIdsChange,
  onInviteMoreInterviewers,
}: {
  availableInterviewers: CalendarInterviewer[];
  selectedInterviewerIds: Set<string>;
  onSelectedInterviewerIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onInviteMoreInterviewers: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Interviewers</p>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {availableInterviewers.map((interviewer) => (
          <label
            key={interviewer.id}
            className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50"
          >
            <input
              type="checkbox"
              checked={selectedInterviewerIds.has(interviewer.id)}
              onChange={(event) => {
                onSelectedInterviewerIdsChange((currentIds) =>
                  toggleCalendarInterviewerSelection(currentIds, interviewer.id, event.target.checked)
                );
              }}
              className="rounded"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{interviewer.name}</div>
              {interviewer.email && (
                <div className="truncate text-xs text-muted-foreground">{interviewer.email}</div>
              )}
            </div>
          </label>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full"
        onClick={onInviteMoreInterviewers}
      >
        <Plus className="mr-2 h-4 w-4" />
        Invite More Interviewers
      </Button>
    </div>
  );
}

function MissingInterviewerAlert() {
  return (
    <Alert variant="destructive" className="py-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-xs">
        Please select at least one interviewer
      </AlertDescription>
    </Alert>
  );
}
