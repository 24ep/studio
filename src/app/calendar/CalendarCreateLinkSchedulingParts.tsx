'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  type CalendarInterviewer,
  type PositionValidation,
  type SearchApplicant,
} from './calendar-page-utils';
import { AppointmentSection } from './CalendarCreateLinkAppointmentParts';

interface SchedulingOptionsProps {
  availableInterviewers: CalendarInterviewer[];
  expireDate: string;
  interviewDateTime: string;
  interviewLocation: string;
  positionValidation: PositionValidation;
  requireLogin: boolean;
  selectedApplicant: SearchApplicant;
  selectedInterviewerIds: Set<string>;
  sendAppointment: boolean;
  onRequireLoginChange: (value: boolean) => void;
  onSelectedInterviewerIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onSendAppointmentChange: (value: boolean) => void;
  setExpireDate: (value: string) => void;
  setInterviewDateTime: (value: string) => void;
  setInterviewLocation: (value: string) => void;
}

export function SchedulingOptions({
  availableInterviewers,
  expireDate,
  interviewDateTime,
  interviewLocation,
  positionValidation,
  requireLogin,
  selectedApplicant,
  selectedInterviewerIds,
  sendAppointment,
  onRequireLoginChange,
  onSelectedInterviewerIdsChange,
  onSendAppointmentChange,
  setExpireDate,
  setInterviewDateTime,
  setInterviewLocation,
}: SchedulingOptionsProps) {
  return (
    <div className="space-y-4">
      <DateTimeField
        id="expireDate"
        label="Link Expires"
        value={expireDate}
        onChange={setExpireDate}
      />

      <DateTimeField
        id="interviewDateTime"
        label="Interview Date & Time"
        value={interviewDateTime}
        onChange={setInterviewDateTime}
        placeholder="Optional"
      />

      <div className="space-y-2">
        <Label htmlFor="interviewLocation" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Interview Location
        </Label>
        <Input
          id="interviewLocation"
          type="text"
          value={interviewLocation}
          onChange={(event) => setInterviewLocation(event.target.value)}
          placeholder="e.g., Conference Room A, Zoom link..."
          className="w-full"
        />
      </div>

      <SwitchRow id="requireLogin" label="Require Login" checked={requireLogin} onChange={onRequireLoginChange} />

      <AppointmentSection
        availableInterviewers={availableInterviewers}
        positionValidation={positionValidation}
        selectedApplicant={selectedApplicant}
        selectedInterviewerIds={selectedInterviewerIds}
        sendAppointment={sendAppointment}
        onSelectedInterviewerIdsChange={onSelectedInterviewerIdsChange}
        onSendAppointmentChange={onSendAppointmentChange}
      />
    </div>
  );
}

function DateTimeField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        {label}
      </Label>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full"
        placeholder={placeholder}
      />
    </div>
  );
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
