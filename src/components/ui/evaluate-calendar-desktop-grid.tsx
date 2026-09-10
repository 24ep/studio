"use client";

import { DayCell } from "./evaluate-calendar-items";
import type { EvaluateCalendarProps } from "./evaluate-calendar-types";
import {
  getApplicantsForDate,
  getRemindersForDate,
} from "./evaluate-calendar-utils";

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DesktopCalendarGridProps {
  applicants: EvaluateCalendarProps["applicants"];
  reminders: NonNullable<EvaluateCalendarProps["reminders"]>;
  monthDays: Date[];
  firstDay: number;
  selectedDate: Date;
  onDateSelect: EvaluateCalendarProps["onDateSelect"];
  onApplicantClick: EvaluateCalendarProps["onApplicantClick"];
}

export function DesktopCalendarGrid({
  applicants,
  reminders,
  monthDays,
  firstDay,
  selectedDate,
  onDateSelect,
  onApplicantClick,
}: DesktopCalendarGridProps) {
  return (
    <div className="flex-1 bg-card rounded-lg border overflow-hidden flex flex-col">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-3 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr">
        {Array.from({ length: firstDay }).map((_, idx) => (
          <div key={`empty-${idx}`} className="border-b border-r border-border/30 bg-muted/10 p-1" />
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
          />
        ))}
        {Array.from({ length: 42 - firstDay - monthDays.length }).map((_, idx) => (
          <div key={`fill-${idx}`} className="border-b border-r border-border/30 bg-muted/10 p-1" />
        ))}
      </div>
    </div>
  );
}
