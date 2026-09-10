import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getPool, type DbClient } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { broadcastApplicantCreated } from '@/lib/simple-broadcaster';
import { createDateInTimezone } from '@/lib/dateUtils';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  buildApplicantCreateInput,
  INSERT_APPLICANT_QUERY,
  INSERT_INITIAL_APPLICANT_TRANSITION_QUERY,
} from './applicants-route-utils';
import { requireApplicantsRoutePermission } from './applicants-route-auth';
import { createApplicantSchema } from './applicants-route-create-schema';
import { enqueueAutomaticApplicantScreening } from '@/lib/screening/service';
import {
  dispatchApplicantCreatedWebhook,
  syncRecruiterAndNotify,
  type ApplicantCreatedRow,
} from './applicants-route-create-side-effects';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function getClient() {
  return await getPool().connect();
}

export async function handleCreateApplicant(request: NextRequest) {
  const access = await requireApplicantsRoutePermission('applicantS_CREATE', request);
  if (!access.ok) {
    return access.response;
  }

  const { session } = access;
  const actingUserId = session.user.id;
  const actingUserName = (session.user.name || session.user.email || actingUserId || 'System') as string;

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validationResult = createApplicantSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const createInput = buildApplicantCreateInput(validationResult.data, body);
  if (!createInput) {
    return NextResponse.json({ message: 'Missing name or email in applicant_info' }, { status: 400 });
  }

  const {
    name,
    email,
    phone,
    positionId,
    fitScore,
    status,
    parsedData,
    applicationDate,
    sourceId,
    subSource,
    customAttributes,
    assignmentJustification,
    avatarUrl,
  } = createInput;
  const newApplicantId = uuidv4();

  let client: DbClient | undefined;
  try {
    client = await getClient();
  } catch (connectionError) {
    const errorMessage = getErrorMessage(connectionError);
    console.error('[Applicants API] Failed to connect to database:', connectionError);
    return NextResponse.json({
      message: 'Database connection error',
      error: errorMessage,
    }, { status: 500 });
  }

  try {
    await client.query('BEGIN');
    const applicantResult = await client.query<ApplicantCreatedRow>(INSERT_APPLICANT_QUERY, [
      newApplicantId,
      name,
      email,
      phone,
      positionId,
      fitScore,
      status,
      parsedData,
      customAttributes,
      applicationDate ? new Date(applicationDate) : createDateInTimezone(),
      sourceId,
      subSource,
      assignmentJustification,
      avatarUrl,
    ]);
    const newApplicant = applicantResult.rows[0];

    await client.query(INSERT_INITIAL_APPLICANT_TRANSITION_QUERY, [
      uuidv4(),
      newApplicantId,
      'Applied',
      'Initial creation',
      actingUserId,
    ]);
    await client.query('COMMIT');

    await logAudit(
      'AUDIT',
      `New Applicant '${name}' created by ${actingUserName}.`,
      'API:Applicants:Create',
      actingUserId,
      { applicantId: newApplicantId }
    );

    broadcastApplicantCreated(newApplicant, actingUserId);

    await syncRecruiterAndNotify({
      client,
      applicantId: newApplicantId,
      name,
      positionId,
      actingUserId,
      actingUserName,
      hasRecruiter: Boolean(newApplicant.recruiterId),
    });

    await dispatchApplicantCreatedWebhook(newApplicant);
    await enqueueAutomaticApplicantScreening(newApplicantId).catch(error => {
      console.error('[Applicants API] Unable to enqueue automatic screening:', error);
    });

    return NextResponse.json(
      { message: 'Applicant created successfully', applicant: newApplicant },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Applicants API] Error during rollback:', rollbackError);
      }
    }

    await logAudit(
      'ERROR',
      `Failed to create Applicant. Error: ${errorMessage}`,
      'API:Applicants:Create',
      actingUserId,
      { input: body }
    );
    return NextResponse.json(
      { message: 'Error creating Applicant', error: errorMessage },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
