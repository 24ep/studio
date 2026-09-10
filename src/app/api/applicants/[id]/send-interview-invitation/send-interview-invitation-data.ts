import { NextResponse } from 'next/server';
import type { DbClient } from '@/lib/db';
import { getSystemSetting } from '@/lib/systemSettings';
import { type InterviewerRow, type SendInvitationInput } from './send-interview-invitation-schema';

export interface InvitationApplicantRow {
  id: string;
  name: string;
  email: string;
  positionId: string | null;
}

export interface InvitationPositionRow {
  id: string;
  title: string;
}

interface InvitationOrganizerRow {
  name: string | null;
  email: string | null;
}

export interface InvitationDataContext {
  applicant: InvitationApplicantRow;
  position: InvitationPositionRow;
  interviewers: InterviewerRow[];
  organizer: {
    name: string;
    email: string;
  };
  emailTemplate: string;
  emailSubjectTemplate: string;
  icsDescriptionTemplate: string;
}

export async function loadInvitationDataContext(
  client: DbClient,
  applicantId: string,
  userId: string,
  input: SendInvitationInput
): Promise<{ ok: true; data: InvitationDataContext } | { ok: false; response: NextResponse }> {
  const applicantResult = await client.query<InvitationApplicantRow>(
    'SELECT id, name, email, "positionId" FROM "Applicant" WHERE id = $1',
    [applicantId]
  );

  if (applicantResult.rows.length === 0) {
    return { ok: false, response: NextResponse.json({ message: 'Applicant not found' }, { status: 404 }) };
  }

  const applicant = applicantResult.rows[0];
  const positionId = applicant.positionId;
  if (!positionId) {
    return { ok: false, response: NextResponse.json({ message: 'Applicant is not associated with a position' }, { status: 400 }) };
  }

  const positionResult = await client.query<InvitationPositionRow>(
    'SELECT id, title FROM "Position" WHERE id = $1',
    [positionId]
  );
  if (positionResult.rows.length === 0) {
    return { ok: false, response: NextResponse.json({ message: 'Position not found' }, { status: 404 }) };
  }

  let interviewersQuery = `
    SELECT
      pi.id,
      pi."userId",
      u.name as "userName",
      u.email as "userEmail"
    FROM "PositionInterviewer" pi
    JOIN "User" u ON pi."userId" = u.id
    WHERE pi."positionId" = $1
  `;
  const queryParams: unknown[] = [positionId];

  if (input.interviewerIds && input.interviewerIds.length > 0) {
    interviewersQuery += ' AND pi."userId" = ANY($2)';
    queryParams.push(input.interviewerIds);
  }

  const interviewersResult = await client.query<InterviewerRow>(interviewersQuery, queryParams);
  if (interviewersResult.rows.length === 0) {
    return { ok: false, response: NextResponse.json({ message: 'No interviewers found for this position' }, { status: 400 }) };
  }

  const emailTemplate = input.emailBody || await getSystemSetting('emailTemplateInterviewInvitation');
  if (!emailTemplate) {
    return { ok: false, response: NextResponse.json({ message: 'Email template not configured' }, { status: 500 }) };
  }

  const emailSubjectTemplate = input.emailSubject
    || await getSystemSetting('emailTemplateInterviewInvitationSubject')
    || 'Interview Invitation: {{ApplicantName}} - {{positionTitle}}';
  const icsDescriptionTemplate = await getSystemSetting('icsDescriptionTemplate')
    || 'Interview with {{ApplicantName}} for position {{positionTitle}}.\n\nLocation: {{interviewLocation}}\nInterviewer: {{interviewerName}}';
  const organizerResult = await client.query<InvitationOrganizerRow>(
    'SELECT name, email FROM "User" WHERE id = $1',
    [userId]
  );
  const organizer = organizerResult.rows.length > 0
    ? {
      name: organizerResult.rows[0].name || 'Recruitment System',
      email: organizerResult.rows[0].email || 'noreply@system',
    }
    : { name: 'Recruitment System', email: 'noreply@system' };

  return {
    ok: true,
    data: {
      applicant,
      position: positionResult.rows[0],
      interviewers: interviewersResult.rows,
      organizer,
      emailTemplate,
      emailSubjectTemplate,
      icsDescriptionTemplate,
    },
  };
}
