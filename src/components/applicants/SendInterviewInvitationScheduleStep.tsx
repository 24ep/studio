"use client";

import { SendInterviewInvitationInterviewersSection } from './SendInterviewInvitationInterviewersSection';
import { SendInterviewInvitationScheduleFields } from './SendInterviewInvitationScheduleFields';
import type { SendInterviewInvitationScheduleStepProps } from './SendInterviewInvitationScheduleStepTypes';

export function SendInterviewInvitationScheduleStep(props: SendInterviewInvitationScheduleStepProps) {
  return (
    <div className="space-y-6 py-4">
      <SendInterviewInvitationScheduleFields
        interviewDate={props.interviewDate}
        interviewTime={props.interviewTime}
        duration={props.duration}
        location={props.location}
        locationEmail={props.locationEmail}
        locationType={props.locationType}
        rooms={props.rooms}
        loadingRooms={props.loadingRooms}
        onInterviewDateChange={props.onInterviewDateChange}
        onInterviewTimeChange={props.onInterviewTimeChange}
        onDurationChange={props.onDurationChange}
        onLocationChange={props.onLocationChange}
        onLocationEmailChange={props.onLocationEmailChange}
        onLocationTypeChange={props.onLocationTypeChange}
      />

      <SendInterviewInvitationInterviewersSection
        interviewers={props.interviewers}
        selectedInterviewerIds={props.selectedInterviewerIds}
        loadingInterviewers={props.loadingInterviewers}
        addInterviewerOpen={props.addInterviewerOpen}
        filteredAvailableUsers={props.filteredAvailableUsers}
        selectedUserIds={props.selectedUserIds}
        loadingUsers={props.loadingUsers}
        addingInterviewers={props.addingInterviewers}
        onAddInterviewerOpenChange={props.onAddInterviewerOpenChange}
        onSelectedUserIdsChange={props.onSelectedUserIdsChange}
        onAddInterviewers={props.onAddInterviewers}
        onToggleInterviewer={props.onToggleInterviewer}
      />
    </div>
  );
}
