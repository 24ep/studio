import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET_NAME } from '../../../../lib/minio';
import prisma from '../../../../lib/prisma';
import { getSystemSetting } from '../../../../lib/db';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

async function sendToN8N(candidateId: string, candidateName: string, fileNameInMinio: string, originalFileName: string, mimeType: string): Promise<{ success: boolean, data?: any, error?: string, message?: string }> {
  const n8nWebhookUrl = await getSystemSetting('n8nResumeWebhookUrl'); // Fetch from DB
  
  if (!n8nWebhookUrl) {
    console.log('N8N_RESUME_WEBHOOK_URL not configured in SystemSetting table. Skipping n8n notification.');
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
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id || null; 
  const actingUserName = session?.user?.name || session?.user?.email || 'System (API Resume Upload)';

  const candidateId = request.nextUrl.searchParams.get('candidateId');
  if (!candidateId) {
    return NextResponse.json({ message: 'Candidate ID is required as a query parameter' }, { status: 400 });
  }
  
  let candidateDBRecord: { id: string; name: string | null; } | null = null;
  try {
    candidateDBRecord = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, name: true }
    });
    if (!candidateDBRecord) {
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
  } catch (dbError: any) {
     console.error('Database error fetching candidate:', dbError);
     await logAudit('ERROR', `Database error fetching candidate (ID: ${candidateId}) for resume upload. Error: ${dbError.message}`, 'API:Resumes', actingUserId, { targetCandidateId: candidateId });
     return NextResponse.json({ message: 'Error verifying candidate', error: dbError.message || 'An unknown database error occurred while fetching candidate.' }, { status: 500 });
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

    try {
      await prisma.$transaction([
        prisma.candidate.update({
          where: { id: candidateId },
          data: { resumePath: fileNameInMinio },
        }),
        prisma.resumeHistory.create({
          data: {
            id: uuidv4(),
            candidateId: candidateId,
            filePath: fileNameInMinio,
            originalFileName: file.name,
            uploadedByUserId: actingUserId,
          },
        }),
      ]);
    } catch (error) {
        console.error("Transaction failed:", error)
        // No need to rollback, prisma handles it
        throw error; // Re-throw to be caught by outer catch
    }


    await logAudit('AUDIT', `Resume '${fileNameInMinio}' uploaded for candidate '${candidateDBRecord.name}' (ID: ${candidateId}) by ${actingUserName}.`, 'API:Resumes', actingUserId, { targetCandidateId: candidateId, filePath: fileNameInMinio, originalFileName: file.name });

    const n8nResult = await sendToN8N(candidateId, candidateDBRecord.name!, fileNameInMinio, file.name, file.type);

    const updatedCandidateWithDetails = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        position: true,
        recruiter: true,
        transitionHistory: {
          include: {
            actingUser: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });


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
