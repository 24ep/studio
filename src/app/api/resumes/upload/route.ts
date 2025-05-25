
import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET_NAME } from '../../../lib/minio';
import pool from '../../../lib/db';
import type { Candidate } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

async function sendToN8N(candidateId: string, candidateName: string, fileNameInMinio: string, originalFileName: string, mimeType: string): Promise<any> {
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
      return { success: true, data: n8nResponseBody };
    } else {
      console.error(`Failed to send resume details to n8n for candidate ${candidateId}. Status: ${response.status}, Body:`, n8nResponseBody);
      await logAudit('WARN', `Failed to send resume details for candidate '${candidateName}' (ID: ${candidateId}) to n8n. Status: ${response.status}. File: ${fileNameInMinio}`, 'API:Resumes:N8N', null, { targetCandidateId: candidateId, minioFile: fileNameInMinio, n8nError: n8nResponseBody });
      return { success: false, error: `n8n responded with status ${response.status}. Details: ${JSON.stringify(n8nResponseBody)}` };
    }
  } catch (error) {
    console.error(`Error sending resume details to n8n for candidate ${candidateId}:`, error);
    await logAudit('ERROR', `Error sending resume details for candidate '${candidateName}' (ID: ${candidateId}) to n8n. Error: ${(error as Error).message}. File: ${fileNameInMinio}`, 'API:Resumes:N8N', null, { targetCandidateId: candidateId, minioFile: fileNameInMinio });
    return { success: false, error: (error as Error).message };
  }
}

export async function POST(request: NextRequest) {
  const candidateId = request.nextUrl.searchParams.get('candidateId');
  if (!candidateId) {
    return NextResponse.json({ message: 'Candidate ID is required as a query parameter' }, { status: 400 });
  }

  let candidateDBRecord: Candidate | null = null;
  try {
    const candidateQuery = 'SELECT id, name FROM "Candidate" WHERE id = $1'; 
    const candidateResult = await pool.query(candidateQuery, [candidateId]);
    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
    candidateDBRecord = candidateResult.rows[0];
  } catch (dbError) {
     console.error('Database error fetching candidate:', dbError);
     await logAudit('ERROR', `Database error fetching candidate (ID: ${candidateId}) for resume upload. Error: ${(dbError as Error).message}`, 'API:Resumes', null, { targetCandidateId: candidateId });
     return NextResponse.json({ message: 'Error verifying candidate', error: (dbError as Error).message }, { status: 500 });
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

    await logAudit('AUDIT', `Resume '${fileNameInMinio}' uploaded for candidate '${candidateDBRecord.name}' (ID: ${candidateId}).`, 'API:Resumes', null, { targetCandidateId: candidateId, filePath: fileNameInMinio, originalFileName: file.name });

    const n8nResult = await sendToN8N(candidateId, candidateDBRecord.name, fileNameInMinio, file.name, file.type);

    const finalQuery = `
        SELECT 
            c.*, 
            p.title as "positionTitle",
            p.department as "positionDepartment",
            COALESCE(
              (SELECT json_agg(th.* ORDER BY th.date DESC) FROM "TransitionRecord" th WHERE th."candidateId" = c.id), 
              '[]'::json
            ) as "transitionHistory"
        FROM "Candidate" c
        LEFT JOIN "Position" p ON c."positionId" = p.id
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
        } : null,
    };

    return NextResponse.json({ 
      message: 'Resume uploaded successfully.', 
      filePath: fileNameInMinio,
      candidate: updatedCandidateWithDetails,
      n8nResponse: n8nResult
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading resume:', error);
    await logAudit('ERROR', `Error uploading resume for candidate '${candidateDBRecord?.name || 'Unknown'}' (ID: ${candidateId}). Error: ${error.message}`, 'API:Resumes', null, { targetCandidateId: candidateId });
    if (error.code && error.message) { 
        return NextResponse.json({ message: `MinIO Error: ${error.message}`, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error processing file upload', error: error.message }, { status: 500 });
  }
}

    