"use client";

import { CalendarIcon } from "@heroicons/react/24/outline";

import { ApplicantListItem, ReminderListItem } from "./evaluate-calendar-items";
import type { EvaluateCalendarProps } from "./evaluate-calendar-types";

interface DesktopSelectedDatePanelProps {
  selectedDate: Date;
  applicants: EvaluateCalendarProps["applicants"];
  reminders: NonNullable<EvaluateCalendarProps["reminders"]>;
  onApplicantClick: EvaluateCalendarProps["onApplicantClick"];
}

export function DesktopSelectedDatePanel({
  selectedDate,
  applicants,
  reminders,
  onApplicantClick,
}: DesktopSelectedDatePanelProps) {
  const itemCount = applicants.length + reminders.length;

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {itemCount} item{itemCount !== 1 ? "s" : ""} scheduled
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No items scheduled</p>
            <p className="text-xs mt-1">Select a date with events to see details</p>
          </div>
        )}
      </div>
    </div>
  );
}
