import type { CalendarReminder, EvaluationApplicant } from './evaluate-calendar-types';

export const DAY_CELL_VISIBLE_APPLICANT_LIMIT = 3;
export const DAY_CELL_VISIBLE_REMINDER_LIMIT = 2;

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatCalendarTime(dateValue: string | Date) {
  return new Date(dateValue).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function isCalendarActivationKey(key: string) {
  return key === "Enter" || key === " ";
}

export function getDayCellOverflowCount(applicantCount: number, reminderCount: number) {
  const visibleApplicantCount = Math.min(applicantCount, DAY_CELL_VISIBLE_APPLICANT_LIMIT);
  const visibleReminderCount = Math.min(reminderCount, DAY_CELL_VISIBLE_REMINDER_LIMIT);
  const visibleCount = visibleApplicantCount + visibleReminderCount;
  return Math.max(0, applicantCount + reminderCount - visibleCount);
}

export function getEvaluationApplicantEventDate(applicant: EvaluationApplicant) {
  return new Date(applicant.evaluationLink.interviewDateTime || applicant.evaluationLink.expiresAt);
}

export function getApplicantsForDate(applicants: EvaluationApplicant[], date: Date): EvaluationApplicant[] {
  const dateStr = date.toDateString();
  return applicants.filter(applicant => {
    const interviewDateTime = applicant.evaluationLink.interviewDateTime;
    if (!interviewDateTime) return false;
    const interviewDate = new Date(interviewDateTime);
    return !Number.isNaN(interviewDate.getTime()) && interviewDate.toDateString() === dateStr;
  });
}

export function getRemindersForDate(reminders: CalendarReminder[], date: Date): CalendarReminder[] {
  const dateStr = date.toDateString();
  return reminders.filter(reminder => new Date(reminder.reminderDate).toDateString() === dateStr);
}

export function getEvaluationApplicantScheduleState(
  applicant: EvaluationApplicant,
  now = new Date()
) {
  const eventDate = getEvaluationApplicantEventDate(applicant);
  const isExpired = new Date(applicant.evaluationLink.expiresAt) < now;
  const isRevoked = applicant.evaluationLink.revokedAt !== null && applicant.evaluationLink.revokedAt !== undefined;
  const isPast = eventDate < now;

  return {
    eventDate,
    timeLabel: eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    isExpired,
    isRevoked,
    isPast,
    isInactive: isExpired || isRevoked || isPast,
    inactiveLabel: isRevoked ? 'Revoked' : isExpired ? 'Expired' : isPast ? 'Passed' : null,
  };
}

export function sortEvaluationApplicantsByScheduleDate(applicants: EvaluationApplicant[]) {
  return [...applicants].sort(
    (a, b) => getEvaluationApplicantEventDate(a).getTime() - getEvaluationApplicantEventDate(b).getTime()
  );
}

export function groupEvaluationApplicantsByDate(applicants: EvaluationApplicant[]) {
  return applicants.reduce<Record<string, EvaluationApplicant[]>>((grouped, applicant) => {
    const dateStr = getEvaluationApplicantEventDate(applicant).toDateString();
    grouped[dateStr] = grouped[dateStr] || [];
    grouped[dateStr].push(applicant);
    return grouped;
  }, {});
}
