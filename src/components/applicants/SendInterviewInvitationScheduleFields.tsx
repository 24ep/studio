"use client";

import {
  InterviewDateField,
  InterviewDurationField,
  InterviewLocationField,
  InterviewTimeField,
} from './SendInterviewInvitationScheduleFieldParts';
import type { SendInterviewInvitationScheduleStepProps } from './SendInterviewInvitationScheduleStepTypes';
import { shouldClearLocationForRoomMode } from './send-interview-invitation-schedule-utils';

export type ScheduleFieldsProps = Pick<
  SendInterviewInvitationScheduleStepProps,
  | 'interviewDate'
  | 'interviewTime'
  | 'duration'
  | 'location'
  | 'locationEmail'
  | 'locationType'
  | 'rooms'
  | 'loadingRooms'
  | 'onInterviewDateChange'
  | 'onInterviewTimeChange'
  | 'onDurationChange'
  | 'onLocationChange'
  | 'onLocationEmailChange'
  | 'onLocationTypeChange'
>;

export function SendInterviewInvitationScheduleFields({
  interviewDate,
  interviewTime,
  duration,
  location,
  locationEmail,
  locationType,
  rooms,
  loadingRooms,
  onInterviewDateChange,
  onInterviewTimeChange,
  onDurationChange,
  onLocationChange,
  onLocationEmailChange,
  onLocationTypeChange,
}: ScheduleFieldsProps) {
  const handleRoomModeClick = () => {
    onLocationTypeChange('room');
    if (shouldClearLocationForRoomMode(rooms, location)) {
      onLocationChange('');
      onLocationEmailChange('');
    }
  };

  const handleCustomModeClick = () => {
    onLocationTypeChange('custom');
    onLocationChange('');
    onLocationEmailChange('');
  };

  return (
    <>
      <InterviewDateField interviewDate={interviewDate} onInterviewDateChange={onInterviewDateChange} />
      <InterviewTimeField interviewTime={interviewTime} onInterviewTimeChange={onInterviewTimeChange} />
      <InterviewDurationField duration={duration} onDurationChange={onDurationChange} />
      <InterviewLocationField
        location={location}
        locationEmail={locationEmail}
        locationType={locationType}
        rooms={rooms}
        loadingRooms={loadingRooms}
        onRoomModeClick={handleRoomModeClick}
        onCustomModeClick={handleCustomModeClick}
        onLocationChange={onLocationChange}
        onLocationEmailChange={onLocationEmailChange}
      />
    </>
  );
}
