"use client";

import type { Dispatch, SetStateAction } from 'react';

import {
  type AzureMeetingRoom,
  type Interviewer,
  type User,
  filterAzureMeetingRooms,
  filterUsersBySearchQuery,
  getAvailableUsersForInterviewers,
  hasMatchingAzureMeetingRoom,
} from './create-evaluate-link-utils';
import {
  EvaluationLinkSettings,
  InterviewDetailsSection,
  InterviewersSection,
  InvitationEmailToggle,
  PositionValidationAlert,
} from './CreateEvaluateLinkConfigureParts';

interface CreateEvaluateLinkConfigureStepProps {
  positionValidation: {
    hasInterviewers: boolean;
    hasSkills: boolean;
    isLoading: boolean;
    error: string | null;
  };
  canProceed: boolean;
  expireDays: number;
  onExpireDaysChange: (days: number) => void;
  requireLogin: boolean;
  onRequireLoginChange: (requireLogin: boolean) => void;
  interviewDate: Date | undefined;
  onInterviewDateChange: (date: Date | undefined) => void;
  datePickerOpen: boolean;
  onDatePickerOpenChange: (open: boolean) => void;
  interviewTime: string;
  onInterviewTimeChange: (time: string) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  location: string;
  onLocationChange: (location: string) => void;
  onLocationEmailChange: (email: string | undefined) => void;
  isCustomLocation: boolean;
  onCustomLocationChange: (isCustom: boolean) => void;
  azureRooms: AzureMeetingRoom[];
  azureMeetingRoomsEnabled: boolean;
  interviewers: Interviewer[];
  availableUsers: User[];
  selectedInterviewerIds: Set<string>;
  onToggleInterviewer: (userId: string) => void;
  addInterviewerOpen: boolean;
  onAddInterviewerOpenChange: (open: boolean) => void;
  selectedUserIds: Set<string>;
  onSelectedUserIdsChange: Dispatch<SetStateAction<Set<string>>>;
  addingInterviewers: boolean;
  interviewerSearchQuery: string;
  onInterviewerSearchQueryChange: (query: string) => void;
  onAddInterviewers: () => void;
  invitationEnabled: boolean;
  sendEmail: boolean;
  onSendEmailChange: (sendEmail: boolean) => void;
}

export function CreateEvaluateLinkConfigureStep({
  positionValidation,
  canProceed,
  expireDays,
  onExpireDaysChange,
  requireLogin,
  onRequireLoginChange,
  interviewDate,
  onInterviewDateChange,
  datePickerOpen,
  onDatePickerOpenChange,
  interviewTime,
  onInterviewTimeChange,
  duration,
  onDurationChange,
  location,
  onLocationChange,
  onLocationEmailChange,
  isCustomLocation,
  onCustomLocationChange,
  azureRooms,
  azureMeetingRoomsEnabled,
  interviewers,
  availableUsers,
  selectedInterviewerIds,
  onToggleInterviewer,
  addInterviewerOpen,
  onAddInterviewerOpenChange,
  selectedUserIds,
  onSelectedUserIdsChange,
  addingInterviewers,
  interviewerSearchQuery,
  onInterviewerSearchQueryChange,
  onAddInterviewers,
  invitationEnabled,
  sendEmail,
  onSendEmailChange,
}: CreateEvaluateLinkConfigureStepProps) {
  const filteredAvailableUsers = getAvailableUsersForInterviewers(availableUsers, interviewers);
  const visibleAvailableUsers = filterUsersBySearchQuery(filteredAvailableUsers, interviewerSearchQuery);
  const matchingAzureRooms = filterAzureMeetingRooms(azureRooms, location);
  const hasMatchingRoom = !location || hasMatchingAzureMeetingRoom(azureRooms, location);

  return (
    <div className="space-y-6 py-4">
      <PositionValidationAlert
        canProceed={canProceed}
        positionValidation={positionValidation}
      />

      <EvaluationLinkSettings
        expireDays={expireDays}
        onExpireDaysChange={onExpireDaysChange}
        onRequireLoginChange={onRequireLoginChange}
        requireLogin={requireLogin}
      />

      <InterviewDetailsSection
        azureMeetingRoomsEnabled={azureMeetingRoomsEnabled}
        azureRooms={azureRooms}
        datePickerOpen={datePickerOpen}
        duration={duration}
        hasMatchingRoom={hasMatchingRoom}
        interviewDate={interviewDate}
        interviewTime={interviewTime}
        isCustomLocation={isCustomLocation}
        location={location}
        matchingAzureRooms={matchingAzureRooms}
        onCustomLocationChange={onCustomLocationChange}
        onDatePickerOpenChange={onDatePickerOpenChange}
        onDurationChange={onDurationChange}
        onInterviewDateChange={onInterviewDateChange}
        onInterviewTimeChange={onInterviewTimeChange}
        onLocationChange={onLocationChange}
        onLocationEmailChange={onLocationEmailChange}
      />

      <InterviewersSection
        addInterviewerOpen={addInterviewerOpen}
        addingInterviewers={addingInterviewers}
        interviewers={interviewers}
        interviewerSearchQuery={interviewerSearchQuery}
        onAddInterviewerOpenChange={onAddInterviewerOpenChange}
        onAddInterviewers={onAddInterviewers}
        onInterviewerSearchQueryChange={onInterviewerSearchQueryChange}
        onSelectedUserIdsChange={onSelectedUserIdsChange}
        onToggleInterviewer={onToggleInterviewer}
        selectedInterviewerIds={selectedInterviewerIds}
        selectedUserIds={selectedUserIds}
        visibleAvailableUsers={visibleAvailableUsers}
      />

      <InvitationEmailToggle
        invitationEnabled={invitationEnabled}
        onSendEmailChange={onSendEmailChange}
        sendEmail={sendEmail}
      />
    </div>
  );
}
