// src/app/api/candidates/upload-for-n8n/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { UserProfile, Position } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { pool } from '../../../../lib/db';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

async function getSystemSetting(key: string): Promise<string | null> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT value FROM "SystemSetting" WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
    return null;
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const actingUserId = session?.user?.id || null;
  const actingUserName = session?.user?.name || session?.user?.email || 'System (n8n Upload)';

  let n8nWebhookUrl = await getSystemSetting('n8nGenericPdfWebhookUrl'); // Fetch from DB first
  if (!n8nWebhookUrl) {
    // Fallback to environment variable if not found in DB
    n8nWebhookUrl = process.env.N8N_GENERIC_PDF_WEBHOOK_URL || null;
  }

  if (!n8nWebhookUrl) {
    const errorMessage = "Automated candidate creation is not configured on the server. Please ensure the Generic PDF Webhook URL is set either in Settings > Integrations or as an N8N_GENERIC_PDF_WEBHOOK_URL environment variable.";
    console.error(errorMessage);
    await logAudit('ERROR', `Attempt to use n8n candidate creation upload by ${actingUserName} (ID: ${actingUserId}) failed: Generic PDF Webhook URL not configured.`, 'API:Candidates:N8NCreate', actingUserId);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('pdfFile') as File | null;
    const targetPositionId = formData.get('positionId') as string | null;
    const targetPositionDescription = formData.get('targetPositionDescription') as string | null;
    const targetPositionLevel = formData.get('targetPositionLevel') as string | null;


    if (!file) {
      return NextResponse.json({ message: 'No PDF file provided in "pdfFile" field' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }, { status: 400 });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only PDF is allowed for this endpoint.' }, { status: 400 });
    }
    
    let targetPositionTitle: string | null = null;
    if (targetPositionId) {
        try {
            const positionRes = await pool.query('SELECT title FROM "Position" WHERE id = $1', [targetPositionId]);
            if (positionRes.rows.length > 0) {
                targetPositionTitle = positionRes.rows[0].title;
            }
        } catch (dbError) {
            console.error(`Error fetching position title for ID ${targetPositionId}:`, dbError);
        }
    }

    // We will forward the file as FormData to n8n
    const n8nFormData = new FormData();
    n8nFormData.append('file', file, file.name); // Send the file itself
    n8nFormData.append('originalFileName', file.name);
    n8nFormData.append('mimeType', file.type);
    n8nFormData.append('sourceApplication', 'NCC Candidate Management');
    n8nFormData.append('uploadTimestamp', new Date().toISOString());
    if (actingUserId) n8nFormData.append('uploadedByUserId', actingUserId);
    if (actingUserName && actingUserName !== 'System (n8n Upload)') n8nFormData.append('uploadedByUserName', actingUserName);
    
    if (targetPositionId) {
        n8nFormData.append('targetPositionId', targetPositionId);
    }
    if (targetPositionTitle) {
        n8nFormData.append('targetPositionTitle', targetPositionTitle);
    }
    if (targetPositionDescription) {
        n8nFormData.append('targetPositionDescription', targetPositionDescription);
    }
    if (targetPositionLevel) {
        n8nFormData.append('targetPositionLevel', targetPositionLevel);
    }


    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      body: n8nFormData, 
      // Do not set Content-Type header when sending FormData;
      // the browser (or fetch) will set it correctly with the boundary.
    });

    if (n8nResponse.ok) {
      console.log(`Successfully sent PDF to n8n for candidate creation: ${file.name}`);
      const n8nResponseBody = await n8nResponse.json().catch(() => ({ message: "Successfully sent to n8n, but no JSON response or n8n response was not JSON."}));
      await logAudit('AUDIT', `PDF resume '${file.name}' sent to n8n for candidate creation by ${actingUserName} (ID: ${actingUserId}). Target Position ID: ${targetPositionId || 'N/A'}.`, 'API:Candidates:N8NCreate', actingUserId, { fileName: file.name, targetPositionId });
      return NextResponse.json({ message: 'PDF successfully sent to n8n workflow for candidate creation.', n8nResponse: n8nResponseBody }, { status: 200 });
    } else {
      const errorBody = await n8nResponse.text();
      console.error(`Failed to send PDF to n8n for candidate creation. n8n status: ${n8nResponse.status}, Body: ${errorBody}`);
      await logAudit('ERROR', `Failed to send PDF resume '${file.name}' to n8n for candidate creation by ${actingUserName} (ID: ${actingUserId}). n8n status: ${n8nResponse.status}. Target Position ID: ${targetPositionId || 'N/A'}.`, 'API:Candidates:N8NCreate', actingUserId, { fileName: file.name, n8nError: errorBody, targetPositionId });
      return NextResponse.json({ message: `Failed to send PDF to n8n workflow. n8n responded with status ${n8nResponse.status}.`, errorDetails: errorBody }, { status: n8nResponse.status });
    }
  } catch (error) {
    console.error('Error processing PDF upload for n8n candidate creation:', error);
    await logAudit('ERROR', `Error processing PDF upload for n8n candidate creation by ${actingUserName} (ID: ${actingUserId}). Error: ${(error as Error).message}`, 'API:Candidates:N8NCreate', actingUserId);
    return NextResponse.json({ message: 'Error processing file upload', error: (error as Error).message }, { status: 500 });
  }
}
