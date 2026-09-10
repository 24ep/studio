"use client";

import {
  ArrowPathIcon as Loader2,
  ExclamationCircleIcon as AlertCircle,
  UsersIcon as Users,
} from '@heroicons/react/24/outline';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { Interviewer } from './send-interview-invitation-api';
import { getPersonPositionSuffix } from './send-interview-invitation-modal-utils';

export interface SelectedInterviewersListProps {
  interviewers: Interviewer[];
  selectedInterviewerIds: Set<string>;
  loadingInterviewers: boolean;
  onToggleInterviewer: (interviewerId: string) => void;
}

export function SelectedInterviewersList({
  interviewers,
  selectedInterviewerIds,
  loadingInterviewers,
  onToggleInterviewer,
}: SelectedInterviewersListProps) {
  if (loadingInterviewers) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading interviewers...
        </span>
      </div>
    );
  }

  if (interviewers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No interviewers assigned to this position. Add interviewers above.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-48 rounded-md border p-4">
      <div className="space-y-3">
        {interviewers.map(interviewer => (
          <InterviewerRow
            key={interviewer.userId}
            interviewer={interviewer}
            checked={selectedInterviewerIds.has(interviewer.userId)}
            onToggleInterviewer={onToggleInterviewer}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function InterviewerRow({
  interviewer,
  checked,
  onToggleInterviewer,
}: {
  interviewer: Interviewer;
  checked: boolean;
  onToggleInterviewer: (interviewerId: string) => void;
}) {
  return (
    <div className="flex items-center space-x-3">
      <Checkbox
        id={`interviewer-${interviewer.userId}`}
        checked={checked}
        onCheckedChange={() => onToggleInterviewer(interviewer.userId)}
      />
      <Label htmlFor={`interviewer-${interviewer.userId}`} className="flex-1 cursor-pointer">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{interviewer.userName}</span>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            {interviewer.userEmail}
            {interviewer.positionTitle ? <span className="italic ml-1 opacity-70">{getPersonPositionSuffix(interviewer.positionTitle)}</span> : null}
          </div>
        </div>
      </Label>
    </div>
  );
}
