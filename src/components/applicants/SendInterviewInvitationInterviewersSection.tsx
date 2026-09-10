"use client";

import {
  PlusIcon as Plus,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import type { SendInterviewInvitationScheduleStepProps } from './SendInterviewInvitationScheduleStepTypes';
import {
  AddInterviewersPanel,
  SelectedInterviewersList,
} from './SendInterviewInvitationInterviewersSectionParts';
import { getInterviewerSelectionSummary } from './send-interview-invitation-modal-utils';

type InterviewersSectionProps = Pick<
  SendInterviewInvitationScheduleStepProps,
  | 'interviewers'
  | 'selectedInterviewerIds'
  | 'loadingInterviewers'
  | 'addInterviewerOpen'
  | 'filteredAvailableUsers'
  | 'selectedUserIds'
  | 'loadingUsers'
  | 'addingInterviewers'
  | 'onAddInterviewerOpenChange'
  | 'onSelectedUserIdsChange'
  | 'onAddInterviewers'
  | 'onToggleInterviewer'
>;

export function SendInterviewInvitationInterviewersSection({
  interviewers,
  selectedInterviewerIds,
  loadingInterviewers,
  addInterviewerOpen,
  filteredAvailableUsers,
  selectedUserIds,
  loadingUsers,
  addingInterviewers,
  onAddInterviewerOpenChange,
  onSelectedUserIdsChange,
  onAddInterviewers,
  onToggleInterviewer,
}: InterviewersSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Interviewers *</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddInterviewerOpenChange(!addInterviewerOpen)}
          disabled={loadingUsers || addingInterviewers}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Interviewer
        </Button>
      </div>

      {addInterviewerOpen ? (
        <AddInterviewersPanel
          filteredAvailableUsers={filteredAvailableUsers}
          selectedUserIds={selectedUserIds}
          loadingUsers={loadingUsers}
          addingInterviewers={addingInterviewers}
          onAddInterviewerOpenChange={onAddInterviewerOpenChange}
          onSelectedUserIdsChange={onSelectedUserIdsChange}
          onAddInterviewers={onAddInterviewers}
        />
      ) : null}

      <SelectedInterviewersList
        interviewers={interviewers}
        selectedInterviewerIds={selectedInterviewerIds}
        loadingInterviewers={loadingInterviewers}
        onToggleInterviewer={onToggleInterviewer}
      />

      <p className="text-xs text-muted-foreground">
        {getInterviewerSelectionSummary(selectedInterviewerIds.size, interviewers.length)}
      </p>
    </div>
  );
}
