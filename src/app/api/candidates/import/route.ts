
// src/app/api/candidates/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { CandidateStatus, CandidateDetails, PersonalInfo, ContactInfo } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

// Core statuses for fallback, full list comes from DB
const coreCandidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const importCandidateItemSchema = z.object({
  name: z.string().min(1, "Name is required").optional(), 
  email: z.string().email("Invalid email address").optional(), 
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(100).optional().default(0),
  status: z.string().min(1).optional().default('Applied'), // Changed from z.enum
  applicationDate: z.string().datetime().optional(),
  parsedData: z.object({
    personal_info: z.object({
        firstname: z.string().min(1),
        lastname: z.string().min(1),
        title_honorific: z.string().optional().default(''),
        nickname: z.string().optional().default(''),
        location: z.string().optional().default(''),
        introduction_aboutme: z.string().optional().default('')
    }).passthrough(),
    contact_info: z.object({
        email: z.string().email(),
        phone: z.string().optional().default('')
    }).passthrough(),
    cv_language: z.string().optional().default(''),
    education: z.array(z.any()).optional().default([]), 
    experience: z.array(z.any()).optional().default([]),
    skills: z.array(z.any()).optional().default([]),
    job_suitable: z.array(z.any()).optional().default([]),
    job_matches: z.array(z.any()).optional().default([]),
    associatedMatchDetails: z.any().optional(),
  }).passthrough().optional(),
});

const importCandidatesSchema = z.array(importCandidateItemSchema);

export async function POST(request: NextRequest) {
  const actingUserId = null; // Public API
  const actingUserName = 'System (Bulk Import)';

  let body;
  try {
    body = await request.json();
  } catch (error) {
    await logAudit('ERROR', `Failed to parse JSON body for candidate import. Error: ${(error as Error).message}`, 'API:Candidates:Import', actingUserId);
    return NextResponse.json({ message: "Invalid JSON payload", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = importCandidatesSchema.safeParse(body);
  if (!validationResult.success) {
    await logAudit('ERROR', `Invalid input for candidate import. Errors: ${JSON.stringify(validationResult.error.flatten())}`, 'API:Candidates:Import', actingUserId);
    return NextResponse.json(
      { message: "Invalid input for candidate import", errors: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  const candidatesToImport = validationResult.data;
  const client = await pool.connect();
  let successfulImports = 0;
  let failedImports = 0;
  const errors: { itemIndex: number, email?: string, error: string }[] = [];

  try {
    for (let i = 0; i < candidatesToImport.length; i++) {
      const item = candidatesToImport[i];
      const candidateEmail = item.email || item.parsedData?.contact_info?.email;
      const candidateName = item.name || `${item.parsedData?.personal_info?.firstname || ''} ${item.parsedData?.personal_info?.lastname || ''}`.trim();
      
      if (!candidateEmail) {
        errors.push({ itemIndex: i, error: "Email is missing." });
        failedImports++;
        continue;
      }
      if (!candidateName) {
        errors.push({ itemIndex: i, email: candidateEmail, error: "Name is missing (derive from parsedData.personal_info.firstname/lastname)." });
        failedImports++;
        continue;
      }

      const finalParsedData: CandidateDetails = item.parsedData ? {
        cv_language: item.parsedData.cv_language || '',
        personal_info: {
            ...(item.parsedData.personal_info),
            firstname: item.parsedData.personal_info.firstname || candidateName.split(' ')[0] || '',
            lastname: item.parsedData.personal_info.lastname || candidateName.split(' ').slice(1).join(' ') || '',
        },
        contact_info: {
            ...(item.parsedData.contact_info),
            email: candidateEmail,
            phone: item.phone || item.parsedData.contact_info.phone || '',
        },
        education: item.parsedData.education || [],
        experience: item.parsedData.experience || [],
        skills: item.parsedData.skills || [],
        job_suitable: item.parsedData.job_suitable || [],
        associatedMatchDetails: item.parsedData.associatedMatchDetails,
        job_matches: item.parsedData.job_matches || [],
      } : { 
        personal_info: { firstname: candidateName.split(' ')[0] || '', lastname: candidateName.split(' ').slice(1).join(' ') || '' },
        contact_info: { email: candidateEmail, phone: item.phone || '' },
      };

      const candidateStatus = item.status || 'Applied';

      try {
        await client.query('BEGIN');
        const existingCandidate = await client.query('SELECT id FROM "Candidate" WHERE email = $1', [candidateEmail]);
        if (existingCandidate.rows.length > 0) {
          errors.push({ itemIndex: i, email: candidateEmail, error: "Candidate with this email already exists." });
          failedImports++;
          await client.query('ROLLBACK');
          continue;
        }

        // Validate status against RecruitmentStage table
        const stageCheck = await client.query('SELECT id FROM "RecruitmentStage" WHERE name = $1', [candidateStatus]);
        if (stageCheck.rows.length === 0) {
          errors.push({ itemIndex: i, email: candidateEmail, error: `Invalid candidate status: '${candidateStatus}'. Stage not found.` });
          failedImports++;
          await client.query('ROLLBACK');
          continue;
        }

        const newCandidateId = uuidv4();
        const insertQuery = `
          INSERT INTO "Candidate" (id, name, email, phone, "positionId", "fitScore", status, "applicationDate", "parsedData", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `;
        await client.query(insertQuery, [
          newCandidateId,
          candidateName,
          candidateEmail,
          item.phone || finalParsedData.contact_info.phone || null,
          item.positionId || null,
          item.fitScore || 0,
          candidateStatus,
          item.applicationDate ? new Date(item.applicationDate) : new Date(),
          finalParsedData,
        ]);

        const insertTransitionQuery = `
          INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "actingUserId", "createdAt", "updatedAt")
          VALUES ($1, $2, NOW(), $3, $4, $5, NOW(), NOW());
        `;
        await client.query(insertTransitionQuery, [
          uuidv4(),
          newCandidateId,
          candidateStatus,
          `Candidate imported by ${actingUserName}.`,
          actingUserId,
        ]);

        await client.query('COMMIT');
        successfulImports++;
      } catch (itemError: any) {
        await client.query('ROLLBACK');
        errors.push({ itemIndex: i, email: candidateEmail, error: itemError.message || "Failed to import this candidate." });
        failedImports++;
      }
    }

    await logAudit('AUDIT', `Candidate import completed. Successful: ${successfulImports}, Failed: ${failedImports}.`, 'API:Candidates:Import', actingUserId, { successfulImports, failedImports, errors });
    return NextResponse.json({
      message: "Candidate import process finished.",
      successfulImports,
      failedImports,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 200 });

  } catch (error) {
    await logAudit('ERROR', `Critical error during candidate import process: ${(error as Error).message}`, 'API:Candidates:Import', actingUserId);
    return NextResponse.json({ message: "Error processing candidate import", error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
}
    