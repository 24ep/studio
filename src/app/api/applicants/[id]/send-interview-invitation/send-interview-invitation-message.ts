import { generateCalendarInvite } from '@/lib/calendarUtils';
import type { EmailAttachment } from '@/lib/emailService';
import type { InterviewerRow } from './send-interview-invitation-schema';
import { replaceTemplateVariables } from './send-interview-invitation-template';
import type {
  InvitationBaseContext,
  InvitationTemplateVariables,
} from './send-interview-invitation-workflow-types';

export function buildInvitationTemplateVariables({
  context,
  interviewer,
  interviewDateFormatted,
  interviewTimeFormatted,
  qrCodeImageHtml,
}: {
  context: InvitationBaseContext;
  interviewer: InterviewerRow;
  interviewDateFormatted: string;
  interviewTimeFormatted: string;
  qrCodeImageHtml: string;
}): InvitationTemplateVariables {
  return {
    applicantName: context.applicant.name,
    positionTitle: context.position.title,
    interviewDate: interviewDateFormatted,
    interviewTime: interviewTimeFormatted,
    interviewLocation: context.input.location || 'TBD',
    evaluationLink: context.evaluationLink || '',
    evaluationQrcodeImage: qrCodeImageHtml,
    interviewerName: interviewer.userName,
  };
}

export function buildInterviewCalendarAttachment({
  context,
  interviewer,
  icsDescriptionTemplate,
  templateVariables,
}: {
  context: InvitationBaseContext;
  interviewer: InterviewerRow;
  icsDescriptionTemplate: string;
  templateVariables: InvitationTemplateVariables;
}): EmailAttachment {
  const calendarContent = generateCalendarInvite({
    title: `Interview: ${context.applicant.name} - ${context.position.title}`,
    description: replaceTemplateVariables(icsDescriptionTemplate, {
      ...templateVariables,
      interviewLocation: context.input.location || '',
    }),
    startDate: context.interviewDateTime,
    endDate: context.endDateTime,
    location: context.input.location || '',
    organizer: context.organizer,
    attendees: [
      {
        name: interviewer.userName,
        email: interviewer.userEmail,
      },
      ...(context.input.locationEmail ? [{
        name: context.input.location || 'Meeting Room',
        email: context.input.locationEmail,
        rsvp: true,
        role: 'REQ-PARTICIPANT',
        cutype: 'RESOURCE',
      }] : []),
    ],
  });

  return {
    filename: 'interview.ics',
    content: calendarContent,
    contentType: 'text/calendar; charset=utf-8',
  };
}
