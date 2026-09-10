"use client";

import { cn } from '@/lib/utils';

import { DayCell } from './evaluate-calendar-items';
import type { EvaluateCalendarProps } from './evaluate-calendar-types';
import { getApplicantsForDate, getRemindersForDate } from './evaluate-calendar-utils';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MobileCalendarGrid({
  applicants,
  reminders,
  monthDays,
  firstDay,
  selectedDate,
  isCollapsed,
  onDateSelect,
  onApplicantClick,
}: {
  applicants: EvaluateCalendarProps['applicants'];
  reminders: NonNullable<EvaluateCalendarProps['reminders']>;
  monthDays: Date[];
  firstDay: number;
  selectedDate: Date;
  isCollapsed: boolean;
  onDateSelect: EvaluateCalendarProps['onDateSelect'];
  onApplicantClick: EvaluateCalendarProps['onApplicantClick'];
}) {
  return (
    <div className={cn(
      'bg-card rounded-lg border overflow-hidden transition-all duration-300',
      isCollapsed ? 'max-h-[180px]' : 'max-h-[400px]'
    )}>
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-10 border-b border-r border-border/30 bg-muted/20" />
        ))}
        {monthDays.map((date) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            isSelected={date.toDateString() === selectedDate.toDateString()}
            isToday={date.toDateString() === new Date().toDateString()}
            isOutsideMonth={false}
            applicants={getApplicantsForDate(applicants, date)}
            reminders={getRemindersForDate(reminders, date)}
            onClick={() => onDateSelect(date)}
            onApplicantClick={onApplicantClick}
            compact={isCollapsed}
          />
        ))}
      </div>
    </div>
  );
}
