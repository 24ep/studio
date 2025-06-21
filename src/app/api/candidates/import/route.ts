// src/app/api/candidates/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { CandidateStatus, CandidateDetails, PersonalInfo, ContactInfo } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { pool } from '@/lib/db';
// For actual Excel parsing, you would uncomment and use a library like 'xlsx'
// import * as XLSX from 'xlsx';

// Core statuses for fallback, full list comes from DB
const coreCandidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const importCandidateItemSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(100).optional().default(0),
  status: z.string().min(1).optional().default('Applied'),
  applicationDate: z.string().datetime().optional(), // Expect ISO8601 string from Excel/parsed data
  // parsedData fields (nested objects) need careful mapping from flat Excel columns
  // or expect JSON strings in Excel cells for complex fields
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
    // For Excel import, complex array fields like education, experience, skills, etc.,
    // might need to be provided as JSON strings within their respective Excel cells,
    // or a more sophisticated mapping logic would be needed if they are split into multiple columns.
    education: z.array(z.any()).optional().default([]),
    experience: z.array(z.any()).optional().default([]),
    skills: z.array(z.any()).optional().default([]),
    job_suitable: z.array(z.any()).optional().default([]),
    job_matches: z.array(z.any()).optional().default([]),
    associatedMatchDetails: z.any().optional(),
  }).passthrough().optional(),
});

// The overall input for the API is now a single file, not an array of candidates
// The validation below will apply to each row extracted from the Excel file.

export async function POST(request: NextRequest) {
  const actingUserId = null; // Public API
  const actingUserName = 'System (Bulk Import)';

  let candidatesToImport: any[];

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      await logAudit('ERROR', 'No file provided for candidate import.', 'API:Candidates:Import', actingUserId);
      return NextResponse.json({ message: "No file provided in 'file' field." }, { status: 400 });
    }

    // Conceptual: Server-side Excel parsing
    // In a real implementation, you'd use a library like 'xlsx' (SheetJS) here.
    // const buffer = await file.arrayBuffer();
    // const workbook = XLSX.read(buffer, { type: 'buffer' });
    // const sheetName = workbook.SheetNames[0];
    // const worksheet = workbook.Sheets[sheetName];
    // const jsonData = XLSX.utils.sheet_to_json(worksheet);
    // candidatesToImport = jsonData;

    // For this prototype, we'll assume the file contains a JSON array if not actually parsing Excel.
    // This part needs to be replaced with actual Excel parsing logic.
    // If you send JSON through FormData for testing:
    try {
        const fileContent = await file.text();
        candidatesToImport = JSON.parse(fileContent);
         if (!Array.isArray(candidatesToImport)) {
            throw new Error("Uploaded file content is not a valid JSON array.");
        }
    } catch (parseError) {
        await logAudit('ERROR', `Failed to parse uploaded file as JSON for candidate import (Excel parsing not implemented). Error: ${(parseError as Error).message}`, 'API:Candidates:Import', actingUserId);
        return NextResponse.json({ message: "Invalid file content. Expected Excel (conceptual) or JSON array (for testing).", error: (parseError as Error).message }, { status: 400 });
    }
    // End of conceptual/testing block for file parsing

  } catch (error) {
    await logAudit('ERROR', `Failed to process form data for candidate import. Error: ${(error as Error).message}`, 'API:Candidates:Import', actingUserId);
    return NextResponse.json({ message: "Error processing uploaded file", error: (error as Error).message }, { status: 400 });
  }


  const client = await pool.connect();
  let successfulImports = 0;
  let failedImports = 0;
  const errors: { itemIndex: number, email?: string, error: string | object }[] = [];

  try {
    for (let i = 0; i < candidatesToImport.length; i++) {
      const item = candidatesToImport[i];
      const validationResult = importCandidateItemSchema.safeParse(item);

      if (!validationResult.success) {
        errors.push({ itemIndex: i, email: item.email || item.parsedData?.contact_info?.email, error: validationResult.error.flatten() });
        failedImports++;
        continue;
      }
      
      const validatedItem = validationResult.data;
      const candidateEmail = validatedItem.email || validatedItem.parsedData?.contact_info?.email;
      const candidateName = validatedItem.name || `${validatedItem.parsedData?.personal_info?.firstname || ''} ${validatedItem.parsedData?.personal_info?.lastname || ''}`.trim();

      if (!candidateEmail) {
        errors.push({ itemIndex: i, error: "Email is missing in validated data." });
        failedImports++;
        continue;
      }
      if (!candidateName) {
        errors.push({ itemIndex: i, email: candidateEmail, error: "Name is missing in validated data." });
        failedImports++;
        continue;
      }

      const finalParsedData: CandidateDetails = validatedItem.parsedData ? {
        cv_language: validatedItem.parsedData.cv_language || '',
        personal_info: {
            ...(validatedItem.parsedData.personal_info),
            firstname: validatedItem.parsedData.personal_info.firstname || candidateName.split(' ')[0] || '',
            lastname: validatedItem.parsedData.personal_info.lastname || candidateName.split(' ').slice(1).join(' ') || '',
        },
        contact_info: {
            ...(validatedItem.parsedData.contact_info),
            email: candidateEmail,
            phone: validatedItem.phone || validatedItem.parsedData.contact_info.phone || '',
        },
        education: validatedItem.parsedData.education || [],
        experience: validatedItem.parsedData.experience || [],
        skills: validatedItem.parsedData.skills || [],
        job_suitable: validatedItem.parsedData.job_suitable || [],
        associatedMatchDetails: validatedItem.parsedData.associatedMatchDetails,
        job_matches: validatedItem.parsedData.job_matches || [],
      } : {
        personal_info: { firstname: candidateName.split(' ')[0] || '', lastname: candidateName.split(' ').slice(1).join(' ') || '' },
        contact_info: { email: candidateEmail, phone: validatedItem.phone || '' },
      };

      const candidateStatus = validatedItem.status || 'Applied';

      try {
        await client.query('BEGIN');
        const existingCandidate = await client.query('SELECT id FROM "Candidate" WHERE email = $1', [candidateEmail]);
        if (existingCandidate.rows.length > 0) {
          errors.push({ itemIndex: i, email: candidateEmail, error: "Candidate with this email already exists." });
          failedImports++;
          await client.query('ROLLBACK');
          continue;
        }

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
          validatedItem.phone || finalParsedData.contact_info.phone || null,
          validatedItem.positionId || null,
          validatedItem.fitScore || 0,
          candidateStatus,
          validatedItem.applicationDate ? new Date(validatedItem.applicationDate) : new Date(),
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

    