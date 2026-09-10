"use client";

import { format } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon as Clock,
  MapPinIcon as MapPin,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ScheduleFieldsProps } from './SendInterviewInvitationScheduleFields';
import {
  getInterviewDurationLabel,
  parseInterviewDurationInput,
} from './send-interview-invitation-schedule-utils';

export function InterviewDateField({
  interviewDate,
  onInterviewDateChange,
}: Pick<ScheduleFieldsProps, 'interviewDate' | 'onInterviewDateChange'>) {
  return (
    <div className="space-y-2">
      <Label htmlFor="interview-date">Interview Date *</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !interviewDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {interviewDate ? format(interviewDate, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover" align="start" popoverId="send-invitation-date-picker" zIndexType="modal">
          <Calendar
            mode="single"
            selected={interviewDate}
            onSelect={onInterviewDateChange}
            disabled={(date) => date < new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function InterviewTimeField({
  interviewTime,
  onInterviewTimeChange,
}: Pick<ScheduleFieldsProps, 'interviewTime' | 'onInterviewTimeChange'>) {
  return (
    <div className="space-y-2">
      <Label htmlFor="interview-time">Interview Time *</Label>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input
          id="interview-time"
          type="time"
          value={interviewTime}
          onChange={(event) => onInterviewTimeChange(event.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );
}

export function InterviewDurationField({
  duration,
  onDurationChange,
}: Pick<ScheduleFieldsProps, 'duration' | 'onDurationChange'>) {
  return (
    <div className="space-y-2">
      <Label htmlFor="duration">Duration (minutes) *</Label>
      <Input
        id="duration"
        type="number"
        min="15"
        max="480"
        step="15"
        value={duration}
        onChange={(event) => onDurationChange(parseInterviewDurationInput(event.target.value))}
      />
      <p className="text-xs text-muted-foreground">
        {getInterviewDurationLabel(duration)}
      </p>
    </div>
  );
}

export function InterviewLocationField({
  location,
  locationEmail,
  locationType,
  rooms,
  loadingRooms,
  onRoomModeClick,
  onCustomModeClick,
  onLocationChange,
  onLocationEmailChange,
}: Pick<ScheduleFieldsProps, 'location' | 'locationEmail' | 'locationType' | 'rooms' | 'loadingRooms' | 'onLocationChange' | 'onLocationEmailChange'> & {
  onRoomModeClick: () => void;
  onCustomModeClick: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="location">Location *</Label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={locationType === 'room' ? 'default' : 'outline'}
            size="sm"
            onClick={onRoomModeClick}
            disabled={loadingRooms || rooms.length === 0}
          >
            Meeting Room
          </Button>
          <Button
            type="button"
            variant={locationType === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={onCustomModeClick}
          >
            Custom Location
          </Button>
        </div>

        {locationType === 'room' ? (
          <Select
            value={locationEmail}
            onValueChange={(value) => {
              const room = rooms.find((roomOption) => roomOption.emailAddress === value);
              if (room) {
                onLocationChange(room.displayName);
                onLocationEmailChange(room.emailAddress);
              }
            }}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select a meeting room" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.emailAddress}>
                  {room.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder="e.g., Zoom, Google Meet, Off-site"
              value={location}
              onChange={(event) => {
                onLocationChange(event.target.value);
                onLocationEmailChange('');
              }}
            />
          </div>
        )}
        {locationType === 'room' && loadingRooms && (
          <p className="text-xs text-muted-foreground">Loading available rooms...</p>
        )}
        {locationType === 'room' && !loadingRooms && rooms.length === 0 && (
          <p className="text-xs text-destructive">No meeting rooms found. Please use Custom Location.</p>
        )}
      </div>
    </div>
  );
}
