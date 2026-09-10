"use client";

import { CalendarIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ApplicantListItem, ReminderListItem } from './evaluate-calendar-items';
import type { EvaluateCalendarProps } from './evaluate-calendar-types';
import { getRemindersForDate } from './evaluate-calendar-utils';

export function MobileEvaluationListView({
  applicantsByDate,
  reminders,
  onApplicantClick,
  onCalendarView,
}: {
  applicantsByDate: Record<string, Parameters<typeof ApplicantListItem>[0]['applicant'][]>;
  reminders: NonNullable<EvaluateCalendarProps['reminders']>;
  onApplicantClick: EvaluateCalendarProps['onApplicantClick'];
  onCalendarView: () => void;
}) {
  const hasItems = Object.keys(applicantsByDate).length > 0 || reminders.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Scheduled Evaluations</h2>
        <Button variant="outline" size="sm" onClick={onCalendarView} className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          Calendar
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        {Object.entries(applicantsByDate).map(([dateStr, dateApplicants]) => (
          <MobileEvaluationListDateGroup
            key={dateStr}
            date={new Date(dateStr)}
            applicants={dateApplicants}
            reminders={reminders}
            onApplicantClick={onApplicantClick}
          />
        ))}
        {!hasItems && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No scheduled evaluations</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileEvaluationListDateGroup({
  date,
  applicants,
  reminders,
  onApplicantClick,
}: {
  date: Date;
  applicants: Parameters<typeof ApplicantListItem>[0]['applicant'][];
  reminders: NonNullable<EvaluateCalendarProps['reminders']>;
  onApplicantClick: EvaluateCalendarProps['onApplicantClick'];
}) {
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <CalendarIcon className="h-4 w-4 text-primary" />
        <h3 className={cn('font-medium text-sm', isToday && 'text-primary')}>
          {isToday ? 'Today' : date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </h3>
        <span className="text-xs text-muted-foreground">
          ({applicants.length} applicant{applicants.length > 1 ? 's' : ''})
        </span>
      </div>
      <div className="space-y-2">
        {applicants.map((applicant) => (
          <ApplicantListItem
            key={applicant.id}
            applicant={applicant}
            onClick={() => onApplicantClick(applicant.id)}
          />
        ))}
        {getRemindersForDate(reminders, date).map((reminder) => (
          <ReminderListItem
            key={reminder.id}
            reminder={reminder}
            onClick={() => onApplicantClick(reminder.applicant.id, true)}
          />
        ))}
      </div>
    </div>
  );
}
