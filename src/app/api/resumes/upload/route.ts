
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { minioClient, MINIO_BUCKET_NAME, ensureBucketExists } from '../../../../lib/minio';
import pool from '../../../../lib/db';
import type { UserProfile } from '@/lib/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Ensure the bucket exists when the module is loaded.
// This is an async operation but we call it here for its side effect.
// In a real app, this might be part of a startup script or health check.
ensureBucketExists(MINIO_BUCKET_NAME).catch(console.error);

async function sendToN8N(candidateId: string, fileNameInMinio: string, originalFileName: string, mimeType: string) {
  const n8nWebhookUrl = process.env.N8N_RESUME_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.log('N8N_RESUME_WEBHOOK_URL not configured. Skipping n8n notification.');
    return;
  }

  try {
    const presignedUrl = await minioClient.presignedGetObject(
      MINIO_BUCKET_NAME,
      fileNameInMinio,
      60 * 60 // 1 hour expiry for the presigned URL
    );

    const payload = {
      candidateId,
      minioObjectName: fileNameInMinio,
      minioBucketName: MINIO_BUCKET_NAME,
      presignedUrl,
      originalFileName,
      mimeType,
    };

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`Successfully sent resume details to n8n for candidate ${candidateId}.`);
    } else {
      const errorBody = await response.text();
      console.error(`Failed to send resume details to n8n for candidate ${candidateId}. Status: ${response.status}, Body: ${errorBody}`);
    }
  } catch (error) {
    console.error(`Error sending resume details to n8n for candidate ${candidateId}:`, error);
  }
}


export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to upload resumes" }, { status: 403 });
  }


  const candidateId = request.nextUrl.searchParams.get('candidateId');
  if (!candidateId) {
    return NextResponse.json({ message: 'Candidate ID is required as a query parameter' }, { status: 400 });
  }

  let candidateDBRecord;
  try {
    const candidateQuery = 'SELECT id FROM "Candidate" WHERE id = $1';
    const candidateResult = await pool.query(candidateQuery, [candidateId]);
    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
    candidateDBRecord = candidateResult.rows[0];
  } catch (dbError) {
     console.error('Database error fetching candidate:', dbError);
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

    const fileName = `${candidateId}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await minioClient.putObject(MINIO_BUCKET_NAME, fileName, buffer, file.size, {
      'Content-Type': file.type,
    });

    const updateQuery = 'UPDATE "Candidate" SET "resumePath" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *;';
    await pool.query(updateQuery, [fileName, candidateId]);

    // Asynchronously send data to n8n - do not await or let it block the response
    sendToN8N(candidateId, fileName, file.name, file.type).catch(err => {
        console.error("Error in sendToN8N background task:", err);
    });

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
        parsedData: finalResult.rows[0].parsedData || { education: [], skills: [], experienceYears: 0, summary: '' },
        position: finalResult.rows[0].positionId ? {
            id: finalResult.rows[0].positionId,
            title: finalResult.rows[0].positionTitle,
            department: finalResult.rows[0].positionDepartment,
        } : null,
    };

    return NextResponse.json({ 
      message: 'Resume uploaded successfully', 
      filePath: fileName,
      candidate: updatedCandidateWithDetails
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading resume:', error);
    if (error.code && error.message) { 
        return NextResponse.json({ message: `MinIO Error: ${error.message}`, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error processing file upload', error: error.message }, { status: 500 });
  }
}

