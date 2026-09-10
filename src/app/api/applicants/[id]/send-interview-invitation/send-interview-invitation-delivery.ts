import { logAudit } from '@/lib/auditLog';
import { sendEmail } from '@/lib/emailService';
import { createInterviewerCalendarEvent } from './send-interview-invitation-calendar';
import type { InvitationDataContext } from './send-interview-invitation-data';
import type { InterviewerRow } from './send-interview-invitation-schema';
import { replaceTemplateVariables } from './send-interview-invitation-template';
import {
  buildInterviewCalendarAttachment,
  buildInvitationTemplateVariables,
} from './send-interview-invitation-message';
import type {
  InvitationBaseContext,
  InvitationWorkflowError,
  InvitationWorkflowResult,
  SendInvitationWorkflowOptions,
} from './send-interview-invitation-workflow-types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function buildInvitationError(interviewer: InterviewerRow, error: string): InvitationWorkflowError {
  return {
    interviewerId: interviewer.userId,
    interviewerName: interviewer.userName,
    interviewerEmail: interviewer.userEmail,
    error,
  };
}

function buildInvitationSuccess(interviewer: InterviewerRow): InvitationWorkflowResult {
  return {
    interviewerId: interviewer.userId,
    interviewerName: interviewer.userName,
    interviewerEmail: interviewer.userEmail,
    success: true,
  };
}

async function logInvitationAudit({
  options,
  context,
  interviewer,
}: {
  options: SendInvitationWorkflowOptions;
  context: InvitationBaseContext;
  interviewer: InterviewerRow;
}) {
  await logAudit(
    'AUDIT',
    `Interview invitation sent to ${interviewer.userName} (${interviewer.userEmail}) for Applicant ${context.applicant.name} by ${options.user.name || options.user.email}`,
    'API:Applicants:SendInterviewInvitation',
    options.user.id,
    {
      applicantId: options.applicantId,
      interviewerId: interviewer.userId,
      interviewDate: context.interviewDateTime.toISOString(),
      interviewTime: context.input.interviewTime,
      duration: context.input.duration,
      location: context.input.location,
    }
  );
}

export async function sendInterviewerInvitation({
  context,
  data,
  interviewDateFormatted,
  interviewTimeFormatted,
  interviewer,
  options,
  qrCodeImageHtml,
}: {
  context: InvitationBaseContext;
  data: InvitationDataContext;
  interviewDateFormatted: string;
  interviewTimeFormatted: string;
  interviewer: InterviewerRow;
  options: SendInvitationWorkflowOptions;
  qrCodeImageHtml: string;
}): Promise<
  { ok: true; result: InvitationWorkflowResult }
  | { ok: false; error: InvitationWorkflowError }
> {
  try {
    const templateVariables = buildInvitationTemplateVariables({
      context,
      interviewer,
      interviewDateFormatted,
      interviewTimeFormatted,
      qrCodeImageHtml,
    });
    const attachment = buildInterviewCalendarAttachment({
      context,
      interviewer,
      icsDescriptionTemplate: data.icsDescriptionTemplate,
      templateVariables,
    });
    const emailResult = await sendEmail(
      interviewer.userEmail,
      replaceTemplateVariables(data.emailSubjectTemplate, templateVariables),
      replaceTemplateVariables(data.emailTemplate, templateVariables),
      [attachment]
    );

    if (!emailResult.success) {
      return { ok: false, error: buildInvitationError(interviewer, emailResult.error || 'Unknown error') };
    }

    await createInterviewerCalendarEvent({ ...context, interviewer });
    await logInvitationAudit({ options, context, interviewer });

    return { ok: true, result: buildInvitationSuccess(interviewer) };
  } catch (error: unknown) {
    return { ok: false, error: buildInvitationError(interviewer, getErrorMessage(error)) };
  }
}
