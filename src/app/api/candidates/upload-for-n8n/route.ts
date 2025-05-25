
// src/app/api/candidates/upload-for-n8n/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserProfile } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Allow Admins or Recruiters to use this feature
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to use n8n candidate creation upload by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter.`, 'API:Candidates:N8NCreate', session.user.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  const n8nWebhookUrl = process.env.N8N_GENERIC_PDF_WEBHOOK_URL; // Using the generic one for this flow
  if (!n8nWebhookUrl) {
    console.error('N8N_GENERIC_PDF_WEBHOOK_URL not configured on the server for candidate creation flow.');
    await logAudit('ERROR', `Attempt to use n8n candidate creation upload by ${session.user.name} (ID: ${session.user.id}) failed: N8N_GENERIC_PDF_WEBHOOK_URL not configured.`, 'API:Candidates:N8NCreate', session.user.id);
    return NextResponse.json({ message: "n8n integration for candidate creation is not configured on the server." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('pdfFile') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No PDF file provided in "pdfFile" field' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }, { status: 400 });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only PDF is allowed for this endpoint.' }, { status: 400 });
    }
    
    // We will forward the file as FormData to n8n
    const n8nFormData = new FormData();
    n8nFormData.append('file', file, file.name); // n8n typically expects a field named 'file' for binary data
    n8nFormData.append('originalFileName', file.name);
    n8nFormData.append('mimeType', file.type);
    n8nFormData.append('sourceApplication', 'NCC Candidate Management');
    n8nFormData.append('uploadTimestamp', new Date().toISOString());
    n8nFormData.append('uploadedByUserId', session.user.id);
    n8nFormData.append('uploadedByUserName', session.user.name || '');
    n8nFormData.append('uploadedByUserEmail', session.user.email || '');

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      body: n8nFormData, 
      // Content-Type for FormData is set automatically by fetch
    });

    if (n8nResponse.ok) {
      console.log(`Successfully sent PDF to n8n for candidate creation: ${file.name}`);
      // Try to parse n8n response, but don't fail if it's not JSON
      const n8nResponseBody = await n8nResponse.json().catch(() => ({ message: "Successfully sent to n8n, but no JSON response or n8n response was not JSON."}));
      await logAudit('AUDIT', `PDF resume '${file.name}' sent to n8n for candidate creation by ${session.user.name} (ID: ${session.user.id}).`, 'API:Candidates:N8NCreate', session.user.id, { fileName: file.name });
      return NextResponse.json({ message: 'PDF successfully sent to n8n workflow for candidate creation.', n8nResponse: n8nResponseBody }, { status: 200 });
    } else {
      const errorBody = await n8nResponse.text();
      console.error(`Failed to send PDF to n8n for candidate creation. n8n status: ${n8nResponse.status}, Body: ${errorBody}`);
      await logAudit('ERROR', `Failed to send PDF resume '${file.name}' to n8n for candidate creation by ${session.user.name} (ID: ${session.user.id}). n8n status: ${n8nResponse.status}.`, 'API:Candidates:N8NCreate', session.user.id, { fileName: file.name, n8nError: errorBody });
      return NextResponse.json({ message: `Failed to send PDF to n8n workflow. n8n responded with status ${n8nResponse.status}.`, errorDetails: errorBody }, { status: n8nResponse.status });
    }
  } catch (error) {
    console.error('Error processing PDF upload for n8n candidate creation:', error);
    await logAudit('ERROR', `Error processing PDF upload for n8n candidate creation by ${session.user.name} (ID: ${session.user.id}). Error: ${(error as Error).message}`, 'API:Candidates:N8NCreate', session.user.id);
    return NextResponse.json({ message: 'Error processing file upload', error: (error as Error).message }, { status: 500 });
  }
}
