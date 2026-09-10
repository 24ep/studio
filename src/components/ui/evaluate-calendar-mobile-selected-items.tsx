"use client";

import { CalendarIcon } from '@heroicons/react/24/outline';

import { ApplicantListItem, ReminderListItem } from './evaluate-calendar-items';
import type { EvaluateCalendarProps } from './evaluate-calendar-types';

export function SelectedDateItems({
  selectedDate,
  applicants,
  reminders,
  onApplicantClick,
}: {
  selectedDate: Date;
  applicants: EvaluateCalendarProps['applicants'];
  reminders: NonNullable<EvaluateCalendarProps['reminders']>;
  onApplicantClick: EvaluateCalendarProps['onApplicantClick'];
}) {
  const itemCount = applicants.length + reminders.length;

  return (
    <>
      <div className="flex items-center gap-2 mt-4 mb-2">
        <CalendarIcon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h3>
        <span className="text-sm text-muted-foreground">
          ({itemCount} item{itemCount !== 1 ? 's' : ''})
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {itemCount > 0 ? (
          <>
            {applicants.map((applicant) => (
              <ApplicantListItem
                key={applicant.id}
                applicant={applicant}
                onClick={() => onApplicantClick(applicant.id)}
              />
            ))}
            {reminders.map((reminder) => (
              <ReminderListItem
                key={reminder.id}
                reminder={reminder}
                onClick={() => onApplicantClick(reminder.applicant.id, true)}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No items scheduled for this date</p>
          </div>
        )}
      </div>
    </>
  );
}
