import { createCalendarEvent } from '@/lib/graphClient';
import type { InterviewerRow } from './send-interview-invitation-schema';
import type { InvitationBaseContext } from './send-interview-invitation-workflow-types';

export async function createInterviewerCalendarEvent(
  context: InvitationBaseContext & { interviewer: InterviewerRow },
) {
  try {
    const calendarResult = await createCalendarEvent({
      attendeeEmail: context.interviewer.userEmail,
      subject: `Interview: ${context.applicant.name} - ${context.position.title}`,
      body: `<p>${context.input.notes || `Interview with ${context.applicant.name} for position ${context.position.title}.`}</p>${context.evaluationLink ? `<p><strong>Evaluation Link:</strong> <a href="${context.evaluationLink}">${context.evaluationLink}</a></p>` : ''}`,
      startDateTime: context.interviewDateTime,
      endDateTime: context.endDateTime,
      location: context.input.location || '',
      organizerName: context.organizer.name,
      organizerEmail: context.organizer.email,
    });

    if (!calendarResult.success) {
      console.warn(`[SendInvitation] Failed to create calendar event: ${calendarResult.error}`);
    }
  } catch (calError) {
    console.error('[SendInvitation] Error creating calendar event:', calError);
  }
}

export async function bookMeetingRoom(
  context: InvitationBaseContext & { interviewers: InterviewerRow[] },
) {
  if (!context.input.locationEmail) {
    return;
  }

  try {
    const roomBookingResult = await createCalendarEvent({
      attendeeEmail: context.input.locationEmail,
      subject: `Interview: ${context.applicant.name} - ${context.position.title}`,
      body: `<p>Interview with ${context.applicant.name} for position ${context.position.title}.</p><p><strong>Interviewer(s):</strong> ${context.interviewers.map((interviewer) => interviewer.userName).join(', ')}</p>`,
      startDateTime: context.interviewDateTime,
      endDateTime: context.endDateTime,
      location: context.input.location || '',
      organizerName: context.organizer.name,
      organizerEmail: context.organizer.email,
    });

    if (!roomBookingResult.success) {
      console.warn(`[SendInvitation] Failed to book room ${context.input.locationEmail}: ${roomBookingResult.error}`);
    }
  } catch (roomError) {
    console.error(`[SendInvitation] Error booking room ${context.input.locationEmail}:`, roomError);
  }
}
