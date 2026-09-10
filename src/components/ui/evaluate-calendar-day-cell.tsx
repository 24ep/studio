"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import { ApplicantAvatarCompact } from "@/components/ui/applicant-avatar";
import { formatApplicantNameWithLang } from "@/lib/applicantUtils";
import { cn } from "@/lib/utils";
import type { CalendarReminder, EvaluationApplicant } from "./evaluate-calendar-types";
import {
  DAY_CELL_VISIBLE_APPLICANT_LIMIT,
  DAY_CELL_VISIBLE_REMINDER_LIMIT,
  getDayCellOverflowCount,
  getEvaluationApplicantScheduleState,
  isCalendarActivationKey,
} from "./evaluate-calendar-utils";

interface DayCellProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isOutsideMonth: boolean;
  applicants: EvaluationApplicant[];
  reminders?: CalendarReminder[];
  onClick: () => void;
  onApplicantClick?: (applicantId: string, isReminder?: boolean) => void;
  compact?: boolean;
}

export function DayCell({
  date,
  isSelected,
  isToday,
  isOutsideMonth,
  applicants,
  reminders = [],
  onClick,
  onApplicantClick,
  compact = false,
}: DayCellProps) {
  const hasEvents = applicants.length > 0 || reminders.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-start transition-all",
        compact ? "h-10 w-full p-0.5" : "min-h-[80px] w-full p-1 border-b border-r border-border/30",
        isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
        isToday && !isSelected && "bg-accent/50",
        isOutsideMonth && "opacity-40",
        "hover:bg-accent/30",
      )}
    >
      <span
        className={cn(
          "text-xs font-medium rounded-full flex items-center justify-center",
          compact ? "h-6 w-6" : "h-6 w-6 mb-1",
          isSelected && "bg-primary text-primary-foreground",
          isToday && !isSelected && "bg-accent text-accent-foreground font-bold",
        )}
      >
        {date.getDate()}
      </span>

      {hasEvents && !compact && (
        <DayCellEventPreview
          applicants={applicants}
          reminders={reminders}
          onApplicantClick={onApplicantClick}
        />
      )}

      {hasEvents && compact && (
        <DayCellCompactDots applicants={applicants} reminders={reminders} />
      )}
    </button>
  );
}

interface DayCellEventPreviewProps {
  applicants: EvaluationApplicant[];
  reminders: CalendarReminder[];
  onApplicantClick?: (applicantId: string, isReminder?: boolean) => void;
}

function DayCellEventPreview({
  applicants,
  reminders,
  onApplicantClick,
}: DayCellEventPreviewProps) {
  const overflowCount = getDayCellOverflowCount(applicants.length, reminders.length);

  return (
    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
      {applicants.slice(0, DAY_CELL_VISIBLE_APPLICANT_LIMIT).map((applicant, index) => (
        <DayCellApplicantChip
          key={`${applicant.id}-${index}`}
          applicant={applicant}
          onClick={() => onApplicantClick?.(applicant.id)}
        />
      ))}
      {reminders.slice(0, DAY_CELL_VISIBLE_REMINDER_LIMIT).map((reminder, index) => (
        <DayCellReminderChip
          key={`rem-${reminder.id}-${index}`}
          reminder={reminder}
          onClick={() => onApplicantClick?.(reminder.applicant.id, true)}
        />
      ))}
      {overflowCount > 0 && (
        <span className="text-[9px] text-muted-foreground text-center">
          +{overflowCount} more
        </span>
      )}
    </div>
  );
}

interface DayCellApplicantChipProps {
  applicant: EvaluationApplicant;
  onClick: () => void;
}

function DayCellApplicantChip({ applicant, onClick }: DayCellApplicantChipProps) {
  const nameInfo = formatApplicantNameWithLang({ name: applicant.name });
  const { isInactive } = getEvaluationApplicantScheduleState(applicant);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate cursor-pointer",
        isInactive
          ? "bg-muted/50 opacity-60 hover:bg-muted/70"
          : "bg-primary/20 hover:bg-primary/30",
      )}
      title={applicant.name}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isCalendarActivationKey(event.key)) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <ApplicantAvatarCompact
        user={{
          id: applicant.id,
          name: applicant.name,
          avatarUrl: applicant.avatarUrl,
          email: applicant.email || undefined,
        }}
        size="sm"
      />
      <span className={cn("truncate", nameInfo.fontClass)} lang={nameInfo.lang}>
        {applicant.name.split(" ")[0]}
      </span>
    </div>
  );
}

interface DayCellReminderChipProps {
  reminder: CalendarReminder;
  onClick: () => void;
}

function DayCellReminderChip({ reminder, onClick }: DayCellReminderChipProps) {
  return (
    <div
      className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate cursor-pointer bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
      title={`Reminder: ${reminder.title}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isCalendarActivationKey(event.key)) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <BellIcon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{reminder.title}</span>
    </div>
  );
}

function DayCellCompactDots({
  applicants,
  reminders,
}: {
  applicants: EvaluationApplicant[];
  reminders: CalendarReminder[];
}) {
  return (
    <div className="flex gap-0.5 mt-0.5">
      {applicants.slice(0, 2).map((_, index) => (
        <div key={`ap-${index}`} className="w-1.5 h-1.5 rounded-full bg-primary" />
      ))}
      {reminders.slice(0, 1).map((_, index) => (
        <div key={`rem-${index}`} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      ))}
    </div>
  );
}
