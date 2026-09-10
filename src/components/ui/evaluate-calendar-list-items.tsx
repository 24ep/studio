"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import {
  ClockIcon as Clock,
  MapPinIcon as MapPin,
  UsersIcon as Users,
} from "@heroicons/react/24/outline";
import { ApplicantAvatarCompact } from "@/components/ui/applicant-avatar";
import { formatApplicantNameWithLang } from "@/lib/applicantUtils";
import { cn } from "@/lib/utils";
import type { CalendarReminder, EvaluationApplicant } from "./evaluate-calendar-types";
import {
  formatCalendarTime,
  getEvaluationApplicantScheduleState,
  isCalendarActivationKey,
} from "./evaluate-calendar-utils";

interface ReminderListItemProps {
  reminder: CalendarReminder;
  onClick: () => void;
}

export function ReminderListItem({ reminder, onClick }: ReminderListItemProps) {
  const reminderTime = formatCalendarTime(reminder.reminderDate);

  return (
    <div
      className="rounded-lg p-3 cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100 border border-amber-200"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isCalendarActivationKey(event.key)) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-14 text-center">
          <div className="flex items-center justify-center gap-1 text-sm font-semibold text-amber-700">
            <Clock className="h-3 w-3" />
            {reminderTime}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">Reminder</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <BellIcon className="h-4 w-4 text-amber-500" />
            <h4 className="font-semibold text-sm truncate text-amber-900">
              {reminder.title}
            </h4>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-700">
            <span className="font-medium">Applicant:</span>
            <span className="truncate">{reminder.applicant.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ApplicantListItemProps {
  applicant: EvaluationApplicant;
  onClick: () => void;
}

export function ApplicantListItem({ applicant, onClick }: ApplicantListItemProps) {
  const nameInfo = formatApplicantNameWithLang({ name: applicant.name });
  const { inactiveLabel, isInactive, timeLabel } = getEvaluationApplicantScheduleState(applicant);

  return (
    <div
      className={cn(
        "rounded-lg p-3 cursor-pointer transition-colors",
        isInactive
          ? "bg-muted/50 opacity-60 hover:bg-muted/70"
          : "bg-secondary hover:bg-secondary/80",
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isCalendarActivationKey(event.key)) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-14 text-center">
          <div className={cn(
            "flex items-center justify-center gap-1 text-sm font-semibold",
            isInactive ? "text-muted-foreground" : "text-primary",
          )}>
            <Clock className="h-3 w-3" />
            {timeLabel}
          </div>
          {isInactive && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {inactiveLabel}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ApplicantAvatarCompact
              user={{
                id: applicant.id,
                name: applicant.name,
                avatarUrl: applicant.avatarUrl,
                email: applicant.email || undefined,
              }}
              size="sm"
            />
            <h4 className={cn("font-semibold text-sm truncate", nameInfo.fontClass)} lang={nameInfo.lang}>
              {applicant.name}
            </h4>
          </div>

          {applicant.position?.title && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <span className="font-medium">Position:</span>
              <span className="truncate">{applicant.position.title}</span>
            </div>
          )}

          {applicant.evaluationLink.interviewLocation && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{applicant.evaluationLink.interviewLocation}</span>
            </div>
          )}

          {applicant.evaluationLink.interviewers && applicant.evaluationLink.interviewers.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="truncate">
                {applicant.evaluationLink.interviewers.map((interviewer) => interviewer.name).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
