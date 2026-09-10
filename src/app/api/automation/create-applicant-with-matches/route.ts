// src/app/api/automation/create-applicant-with-matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool, type DbClient } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';
import { getSystemSetting } from '@/lib/systemSettings';
import { requireAutomationApiKey } from '@/lib/api-route-guards';
import { enqueueAutomaticApplicantScreening } from '@/lib/screening/service';
import { readRequestJsonResult } from '@/lib/request-json';
import { requestSchema } from './create-applicant-with-matches-schema';
import {
  findExistingAutomationApplicant,
  insertAutomationApplicant,
  insertAutomationJobMatches,
  resolveAutomationApplicantStatusId,
} from './create-applicant-with-matches-db';
import {
  buildAutomationApplicantData,
  getAutomationJobMatchAuditCount,
  getErrorMessage,
  getSafeAutomationJobMatches,
} from './create-applicant-with-matches-utils';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = requireAutomationApiKey(request);
  if (authError) return authError;

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    await logAudit('ERROR', 'Invalid JSON body in automation Applicant creation request', 'API:Automation:CreateApplicant', null, { error: 'Invalid JSON' });
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    await logAudit('ERROR', 'Invalid input data in automation Applicant creation request', 'API:Automation:CreateApplicant', null, { 
      errors: validation.error.flatten().fieldErrors,
      input: body 
    });
    return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { job_matches } = validation.data;
  let applicantData = validation.data.applicant;
  
  // Check if job match feature is enabled
  const jobMatchFeatureEnabled = await getSystemSetting('jobMatchFeatureEnabled');
  const isJobMatchEnabled = jobMatchFeatureEnabled !== 'false';
  
  const newApplicantId = uuidv4();
  const client: DbClient = await getPool().connect();

  try {
    await client.query('BEGIN');

    const existingApplicant = await findExistingAutomationApplicant(client, applicantData.email);
    if (existingApplicant) {
      await client.query('COMMIT');
      
      await logAudit('AUDIT', `Duplicate Applicant creation prevented for email ${applicantData.email}`, 'API:Automation:CreateApplicant', null, { 
        existingApplicantId: existingApplicant.id,
        existingApplicantName: existingApplicant.name,
        newApplicantName: applicantData.name,
        email: applicantData.email
      });
      
      return NextResponse.json({ 
        message: 'Applicant already exists', 
        existingApplicant: existingApplicant,
        skipped: true 
      }, { status: 200 });
    }

    const safeJobMatches = getSafeAutomationJobMatches(job_matches, isJobMatchEnabled);
    applicantData = buildAutomationApplicantData(applicantData, safeJobMatches);

    const resolvedStatusId = await resolveAutomationApplicantStatusId(client, applicantData);
    if (!resolvedStatusId) {
      throw new Error('Could not resolve a valid recruitment stage ID for Applicant status');
    }

    const newApplicant = await insertAutomationApplicant({
      applicantData,
      applicantId: newApplicantId,
      client,
      resolvedStatusId,
    });

    await insertAutomationJobMatches({
      applicantId: newApplicantId,
      client,
      safeJobMatches,
    });

    await client.query('COMMIT');
    const jobMatchesCount = getAutomationJobMatchAuditCount(isJobMatchEnabled, safeJobMatches);
    
    await logAudit('AUDIT', `Applicant '${applicantData.name}' created via automation${isJobMatchEnabled ? ` with ${jobMatchesCount} job matches` : ' (job match feature disabled)'}`, 'API:Automation:CreateApplicant', null, { 
      applicantId: newApplicantId,
      applicantName: applicantData.name,
      applicantEmail: applicantData.email,
      positionId: applicantData.positionId,
      recruiterId: applicantData.recruiterId,
      jobMatchesCount,
      fitScore: applicantData.fitScore
    });
    await enqueueAutomaticApplicantScreening(newApplicantId, 'automation').catch(error => console.error('[Automation] Automatic screening enqueue failed:', error));
    
    return NextResponse.json({ message: 'Applicant and matches created successfully', applicant: newApplicant }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    await client.query('ROLLBACK');
    await logAudit('ERROR', `Automation Applicant creation failed. Error: ${errorMessage}`, 'API:Automation:CreateApplicant', null, { 
      applicantName: applicantData.name,
      applicantEmail: applicantData.email,
      error: errorMessage 
    });
    return NextResponse.json({ message: 'Error creating Applicant', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  await logAudit('INFO', 'Automation Applicant creation endpoint health check', 'API:Automation:CreateApplicant', null);
  return NextResponse.json({ ok: true });
}
