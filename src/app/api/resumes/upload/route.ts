
import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET_NAME } from '../../../../lib/minio';
import pool from '../../../../lib/db';
import type { Candidate } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
// import { getServerSession } from 'next-auth/next'; // Removed for public API
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Removed for public API

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

async function sendToN8N(candidateId: string, candidateName: string, fileNameInMinio: string, originalFileName: string, mimeType: string): Promise<{ success: boolean, data?: any, error?: string, message?: string }> {
  const n8nWebhookUrl = process.env.N8N_RESUME_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.log('N8N_RESUME_WEBHOOK_URL not configured. Skipping n8n notification.');
    return { success: true, message: "N8N notification skipped (not configured)." };
  }

  let presignedUrl = '';
  try {
    presignedUrl = await minioClient.presignedGetObject(
      MINIO_BUCKET_NAME,
      fileNameInMinio,
      60 * 60 // 1 hour expiry
    );

    const payload = {
      candidateId,
      candidateName,
      minioObjectName: fileNameInMinio,
      minioBucketName: MINIO_BUCKET_NAME,
      presignedUrl,
      originalFileName,
      mimeType,
    };

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const n8nResponseBody = await response.json().catch(() => ({ message: `Successfully sent to n8n, but no JSON response or n8n response was not JSON. Status: ${response.status}`}));
    
    if (response.ok) {
      console.log(`Successfully sent resume details to n8n for candidate ${candidateId}. n8n response:`, n8nResponseBody);
      await logAudit('INFO', `Resume details for candidate '${candidateName}' (ID: ${candidateId}) sent to n8n. File: ${fileNameInMinio}`, 'API:Resumes:N8N', null, { targetCandidateId: candidateId, minioFile: fileNameInMinio });
      return { success: true, data: n8nResponseBody, message: 'Successfully sent to n8n.' };
    } else {
      console.error(`Failed to send resume details to n8n for candidate ${candidateId}. Status: ${response.status}, Body:`, n8nResponseBody);
      await logAudit('WARN', `Failed to send resume details for candidate '${candidateName}' (ID: ${candidateId}) to n8n. Status: ${response.status}. File: ${fileNameInMinio}`, 'API:Resumes:N8N', null, { targetCandidateId: candidateId, minioFile: fileNameInMinio, n8nError: n8nResponseBody });
      return { success: false, error: `n8n responded with status ${response.status}. Details: ${JSON.stringify(n8nResponseBody)}`, message: `Failed to send to n8n. Status: ${response.status}` };
    }
  } catch (error) {
    console.error(`Error sending resume details to n8n for candidate ${candidateId}:`, error);
    await logAudit('ERROR', `Error sending resume details for candidate '${candidateName}' (ID: ${candidateId}) to n8n. Error: ${(error as Error).message}. File: ${fileNameInMinio}`, 'API:Resumes:N8N', null, { targetCandidateId: candidateId, minioFile: fileNameInMinio });
    return { success: false, error: (error as Error).message, message: `Error during n8n communication: ${(error as Error).message}` };
  }
}

export async function POST(request: NextRequest) {
  const candidateId = request.nextUrl.searchParams.get('candidateId');
  if (!candidateId) {
    return NextResponse.json({ message: 'Candidate ID is required as a query parameter' }, { status: 400 });
  }
  // Public API - session and actingUser for logging might be null
  const actingUserId = null; 
  const actingUserName = 'System (Public API)';

  let candidateDBRecord: Pick<Candidate, 'id' | 'name'> | null = null; // Only fetch id and name
  try {
    const candidateQuery = 'SELECT id, name FROM "Candidate" WHERE id = $1'; 
    const candidateResult = await pool.query(candidateQuery, [candidateId]);
    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
    candidateDBRecord = candidateResult.rows[0];
  } catch (dbError: any) {
     console.error('Database error fetching candidate:', dbError);
     await logAudit('ERROR', `Database error fetching candidate (ID: ${candidateId}) for resume upload. Error: ${dbError.message}`, 'API:Resumes', actingUserId, { targetCandidateId: candidateId });
     return NextResponse.json({ message: dbError.message || 'Error verifying candidate', error: dbError.message || 'An unknown database error occurred while fetching candidate.' }, { status: 500 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No resume file provided in the "resume" field' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024*1024)}MB` }, { status: 400 });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.' }, { status: 400 });
    }

    const fileNameInMinio = `${candidateId}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await minioClient.putObject(MINIO_BUCKET_NAME, fileNameInMinio, buffer, file.size, {
      'Content-Type': file.type,
    });

    const updateQuery = 'UPDATE "Candidate" SET "resumePath" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *;';
    await pool.query(updateQuery, [fileNameInMinio, candidateId]);

    await logAudit('AUDIT', `Resume '${fileNameInMinio}' uploaded for candidate '${candidateDBRecord.name}' (ID: ${candidateId}) by ${actingUserName}.`, 'API:Resumes', actingUserId, { targetCandidateId: candidateId, filePath: fileNameInMinio, originalFileName: file.name });

    const n8nResult = await sendToN8N(candidateId, candidateDBRecord.name, fileNameInMinio, file.name, file.type);

    const finalQuery = `
        SELECT
            c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData",
            c."positionId", c."fitScore", c.status, c."applicationDate",
            c."recruiterId", c."createdAt", c."updatedAt",
            p.title as "positionTitle",
            p.department as "positionDepartment",
            p.position_level as "positionLevel",
            rec.name as "recruiterName",
            COALESCE(
              (SELECT json_agg(
                json_build_object(
                  'id', th.id, 'candidateId', th."candidateId", 'date', th.date, 'stage', th.stage, 'notes', th.notes,
                  'actingUserId', th."actingUserId", 'actingUserName', u.name,
                  'createdAt', th."createdAt", 'updatedAt', th."updatedAt"
                ) ORDER BY th.date DESC
               ) FROM "TransitionRecord" th LEFT JOIN "User" u ON th."actingUserId" = u.id WHERE th."candidateId" = c.id),
              '[]'::json
            ) as "transitionHistory"
        FROM "Candidate" c
        LEFT JOIN "Position" p ON c."positionId" = p.id
        LEFT JOIN "User" rec ON c."recruiterId" = rec.id
        WHERE c.id = $1;
    `;
    const finalResult = await pool.query(finalQuery, [candidateId]);
    const updatedCandidateWithDetails = {
        ...finalResult.rows[0],
        parsedData: finalResult.rows[0].parsedData || { personal_info: {}, contact_info: {} },
        position: finalResult.rows[0].positionId ? {
            id: finalResult.rows[0].positionId,
            title: finalResult.rows[0].positionTitle,
            department: finalResult.rows[0].positionDepartment,
            position_level: finalResult.rows[0].positionLevel,
        } : null,
        recruiter: finalResult.rows[0].recruiterId ? {
            id: finalResult.rows[0].recruiterId,
            name: finalResult.rows[0].recruiterName,
            email: null
        } : null,
        transitionHistory: finalResult.rows[0].transitionHistory || [],
    };

    return NextResponse.json({ 
      message: 'Resume uploaded successfully.', 
      filePath: fileNameInMinio,
      candidate: updatedCandidateWithDetails,
      n8nResponse: n8nResult
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading resume:', error);
    await logAudit('ERROR', `Error uploading resume for candidate '${candidateDBRecord?.name || 'Unknown'}' (ID: ${candidateId}) by ${actingUserName}. Error: ${error.message}`, 'API:Resumes', actingUserId, { targetCandidateId: candidateId });
    if (error.code && error.message && typeof error.message === 'string') { 
        return NextResponse.json({ message: `MinIO Error: ${error.message}`, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ message: error.message || 'Error processing file upload', error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}

