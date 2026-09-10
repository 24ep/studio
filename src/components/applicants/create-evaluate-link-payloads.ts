import { createInterviewDateTime } from './create-evaluate-link-date-utils';

export function buildEvaluationLinkPayload({
  expireDays,
  requireLogin,
  interviewDate,
  interviewTime,
  location,
}: {
  expireDays: number;
  requireLogin: boolean;
  interviewDate?: Date;
  interviewTime: string;
  location: string;
}) {
  const interviewDateTime = createInterviewDateTime(interviewDate, interviewTime);

  return {
    days: Math.max(1, Math.min(365, expireDays || 7)),
    requireLogin,
    interviewDateTime: interviewDateTime?.toISOString(),
    interviewLocation: location || undefined,
  };
}

export function buildInvitationEmailPayload({
  selectedInterviewerIds,
  interviewDate,
  interviewTime,
  duration,
  location,
  locationEmail,
  emailSubject,
  emailBody,
  evaluationLink,
  now = new Date(),
}: {
  selectedInterviewerIds: Set<string>;
  interviewDate?: Date;
  interviewTime: string;
  duration: number;
  location: string;
  locationEmail?: string;
  emailSubject: string;
  emailBody: string;
  evaluationLink: string;
  now?: Date;
}) {
  const scheduledDate = createInterviewDateTime(interviewDate, interviewTime) || new Date(now);

  return {
    interviewerIds: Array.from(selectedInterviewerIds),
    interviewDate: scheduledDate.toISOString(),
    interviewTime,
    duration,
    location: location || undefined,
    locationEmail: locationEmail || undefined,
    emailSubject,
    emailBody,
    evaluationLink,
  };
}
