export interface EvaluationApplicant {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  position?: { id: string; title: string } | null;
  evaluationLink: {
    url: string;
    expiresAt: string;
    revokedAt?: string | null;
    interviewDateTime?: string;
    interviewLocation?: string;
    interviewers?: Array<{ id: string; name: string }>;
  };
}

export interface CalendarReminder {
  id: string;
  title: string;
  reminderDate: string;
  applicant: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface EvaluateCalendarProps {
  applicants: EvaluationApplicant[];
  reminders?: CalendarReminder[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onApplicantClick: (applicantId: string, isReminder?: boolean) => void;
  onScheduleApplicant?: (applicantId: string, interviewDateTime: string) => Promise<void>;
  onCreateLink?: () => void;
  isMobile?: boolean;
}
