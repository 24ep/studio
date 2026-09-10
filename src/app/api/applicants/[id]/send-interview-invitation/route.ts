import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import { authorizeInterviewInvitationRequest } from './send-interview-invitation-auth';
import { loadInvitationDataContext } from './send-interview-invitation-data';
import { getOrCreateEvaluationLink } from './send-interview-invitation-link';
import { sendInvitationSchema, type SendInvitationContext } from './send-interview-invitation-schema';
import { runSendInterviewInvitationWorkflow } from './send-interview-invitation-workflow';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: NextRequest, { params }: SendInvitationContext) {
  const authorization = await authorizeInterviewInvitationRequest();
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id: applicantId } = await params;
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validationResult = sendInvitationSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({
      message: 'Invalid request data',
      errors: validationResult.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const input = validationResult.data;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const invitationData = await loadInvitationDataContext(client, applicantId, authorization.session.user.id, input);
    if (!invitationData.ok) {
      await client.query('ROLLBACK');
      return invitationData.response;
    }

    const evaluationLink = await getOrCreateEvaluationLink(applicantId, authorization.session.user.id);
    const response = await runSendInterviewInvitationWorkflow({
      applicantId,
      user: authorization.session.user,
      input,
      data: invitationData.data,
      evaluationLink,
    });

    await client.query('COMMIT');
    return response;
  } catch (error: unknown) {
    await client.query('ROLLBACK').catch(() => {});
    const errorMessage = getErrorMessage(error);
    console.error('[Send Interview Invitation] Error:', error);
    await logAudit(
      'ERROR',
      `Failed to send interview invitations for Applicant ${applicantId} by ${authorization.session.user.name || authorization.session.user.email}. Error: ${errorMessage}`,
      'API:Applicants:SendInterviewInvitation',
      authorization.session.user.id,
      { applicantId, error: errorMessage }
    );
    return NextResponse.json({
      message: 'Error sending interview invitations',
      error: errorMessage,
    }, { status: 500 });
  } finally {
    client.release();
  }
}
