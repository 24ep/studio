import { NextResponse } from 'next/server';
import { bookMeetingRoom } from './send-interview-invitation-calendar';
import { sendInterviewerInvitation } from './send-interview-invitation-delivery';
import { buildEvaluationQrImageHtml, formatInterviewDateTime, getInterviewDateTimes } from './send-interview-invitation-template';
import type {
  InvitationBaseContext,
  InvitationWorkflowError,
  InvitationWorkflowResult,
  SendInvitationWorkflowOptions,
} from './send-interview-invitation-workflow-types';

export async function runSendInterviewInvitationWorkflow(options: SendInvitationWorkflowOptions) {
  const { applicant, position, interviewers, organizer } = options.data;
  const { interviewDateTime, endDateTime } = getInterviewDateTimes(options.input.interviewDate, options.input.interviewTime, options.input.duration);
  const { interviewDateFormatted, interviewTimeFormatted } = formatInterviewDateTime(interviewDateTime);
  const qrCodeImageHtml = await buildEvaluationQrImageHtml(options.evaluationLink);
  const results: InvitationWorkflowResult[] = [];
  const errors: InvitationWorkflowError[] = [];
  const context: InvitationBaseContext = {
    applicant,
    position,
    organizer,
    input: options.input,
    evaluationLink: options.evaluationLink,
    interviewDateTime,
    endDateTime,
  };

  for (const interviewer of interviewers) {
    const delivery = await sendInterviewerInvitation({
      context,
      data: options.data,
      interviewDateFormatted,
      interviewTimeFormatted,
      interviewer,
      options,
      qrCodeImageHtml,
    });

    if (delivery.ok) {
      results.push(delivery.result);
    } else {
      errors.push(delivery.error);
    }
  }

  await bookMeetingRoom({
    ...context,
    interviewers,
  });

  if (errors.length > 0 && results.length === 0) {
    return NextResponse.json({
      message: 'Failed to send all invitations',
      results,
      errors,
    }, { status: 500 });
  }

  return NextResponse.json({
    message: errors.length > 0
      ? `Sent ${results.length} invitation(s), ${errors.length} failed`
      : `Successfully sent ${results.length} invitation(s)`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
