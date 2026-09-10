"use client";

import {
  CalendarIcon,
  ClockIcon as Clock,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { AzureMeetingRoom } from './create-evaluate-link-utils';
import { CreateEvaluateLinkLocationSelector } from './CreateEvaluateLinkLocationSelector';

interface InterviewDetailsSectionProps {
  azureMeetingRoomsEnabled: boolean;
  azureRooms: AzureMeetingRoom[];
  datePickerOpen: boolean;
  duration: number;
  hasMatchingRoom: boolean;
  interviewDate: Date | undefined;
  interviewTime: string;
  isCustomLocation: boolean;
  location: string;
  matchingAzureRooms: AzureMeetingRoom[];
  onCustomLocationChange: (isCustom: boolean) => void;
  onDatePickerOpenChange: (open: boolean) => void;
  onDurationChange: (duration: number) => void;
  onInterviewDateChange: (date: Date | undefined) => void;
  onInterviewTimeChange: (time: string) => void;
  onLocationChange: (location: string) => void;
  onLocationEmailChange: (email: string | undefined) => void;
}

export function InterviewDetailsSection({
  azureMeetingRoomsEnabled,
  azureRooms,
  datePickerOpen,
  duration,
  hasMatchingRoom,
  interviewDate,
  interviewTime,
  isCustomLocation,
  location,
  matchingAzureRooms,
  onCustomLocationChange,
  onDatePickerOpenChange,
  onDurationChange,
  onInterviewDateChange,
  onInterviewTimeChange,
  onLocationChange,
  onLocationEmailChange,
}: InterviewDetailsSectionProps) {
  return (
    <div className="border-t pt-4 space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" /> Interview Details
      </h3>

      <div className="space-y-2">
        <Label>Interview Date</Label>
        <Popover open={datePickerOpen} onOpenChange={onDatePickerOpenChange} modal={false}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn('w-full justify-start text-left font-normal', !interviewDate && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {interviewDate ? format(interviewDate, 'PPP') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="start" popoverId="create-eval-link-date-picker" zIndexType="modal">
            <Calendar
              mode="single"
              selected={interviewDate}
              onSelect={(date) => {
                onInterviewDateChange(date);
                onDatePickerOpenChange(false);
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Time
          </Label>
          <Input
            type="time"
            value={interviewTime}
            onChange={(event) => onInterviewTimeChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (min)</Label>
          <Input
            type="number"
            min={15}
            max={480}
            step={15}
            value={duration}
            onChange={(event) => onDurationChange(parseInt(event.target.value) || 60)}
          />
        </div>
      </div>

      <CreateEvaluateLinkLocationSelector
        azureMeetingRoomsEnabled={azureMeetingRoomsEnabled}
        azureRooms={azureRooms}
        hasMatchingRoom={hasMatchingRoom}
        isCustomLocation={isCustomLocation}
        location={location}
        matchingAzureRooms={matchingAzureRooms}
        onCustomLocationChange={onCustomLocationChange}
        onLocationChange={onLocationChange}
        onLocationEmailChange={onLocationEmailChange}
      />
    </div>
  );
}
