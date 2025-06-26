// src/app/api/candidates/upload-for-n8n/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { UserProfile, Position } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '../../../../lib/db';
import { authOptions } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

async function getSystemSetting(key: string): Promise<string | null> {
  const client = await getPool().connect();
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

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id || null;
  const actingUserName = session?.user?.name || session?.user?.email || 'System (n8n Upload)';

  let generalPdfWebhookUrl = await getSystemSetting('generalPdfWebhookUrl'); // Fetch from DB first
  if (!generalPdfWebhookUrl) {
    // Fallback to environment variable if not found in DB
    generalPdfWebhookUrl = process.env.GENERAL_PDF_WEBHOOK_URL || null;
  }

  if (!generalPdfWebhookUrl) {
    const errorMessage = "Automated candidate creation is not configured on the server. Please ensure the PDF Webhook URL is set either in Settings > Integrations or as a GENERAL_PDF_WEBHOOK_URL environment variable.";
    console.error(errorMessage);
    await logAudit('ERROR', `Attempt to use candidate creation upload by ${actingUserName} (ID: ${actingUserId}) failed: PDF Webhook URL not configured.`, 'API:Candidates:Create', actingUserId);
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
            const positionRes = await getPool().query('SELECT title FROM "Position" WHERE id = $1', [targetPositionId]);
            if (positionRes.rows.length > 0) {
                targetPositionTitle = positionRes.rows[0].title;
            }
        } catch (dbError) {
            console.error(`Error fetching position title for ID ${targetPositionId}:`, dbError);
        }
    }

    // We will forward the file as FormData to the generic webhook
    const webhookFormData = new FormData();
    webhookFormData.append('file', file, file.name); // Send the file itself
    webhookFormData.append('originalFileName', file.name);
    webhookFormData.append('mimeType', file.type);
    webhookFormData.append('sourceApplication', 'NCC Candidate Management');
    webhookFormData.append('uploadTimestamp', new Date().toISOString());
    if (actingUserId) webhookFormData.append('uploadedByUserId', actingUserId);
    if (actingUserName && actingUserName !== 'System (n8n Upload)') webhookFormData.append('uploadedByUserName', actingUserName);
    
    if (targetPositionId) {
        webhookFormData.append('targetPositionId', targetPositionId);
    }
    if (targetPositionTitle) {
        webhookFormData.append('targetPositionTitle', targetPositionTitle);
    }
    if (targetPositionDescription) {
        webhookFormData.append('targetPositionDescription', targetPositionDescription);
    }
    if (targetPositionLevel) {
        webhookFormData.append('targetPositionLevel', targetPositionLevel);
    }


    const webhookResponse = await fetch(generalPdfWebhookUrl, {
      method: 'POST',
      body: webhookFormData,
    });

    if (webhookResponse.ok) {
      console.log(`Successfully sent PDF to webhook for candidate creation: ${file.name}`);
      const webhookResponseBody = await webhookResponse.json().catch(() => ({ message: "Successfully sent to webhook, but no JSON response or webhook response was not JSON."}));
      await logAudit('AUDIT', `PDF resume '${file.name}' sent to webhook for candidate creation by ${actingUserName} (ID: ${actingUserId}). Target Position ID: ${targetPositionId || 'N/A'}.`, 'API:Candidates:Create', actingUserId, { fileName: file.name, targetPositionId });
      return NextResponse.json({ message: 'PDF successfully sent to workflow for candidate creation.', webhookResponse: webhookResponseBody }, { status: 200 });
    } else {
      const errorBody = await webhookResponse.text();
      console.error(`Failed to send PDF to webhook for candidate creation. Webhook status: ${webhookResponse.status}, Body: ${errorBody}`);
      await logAudit('ERROR', `Failed to send PDF resume '${file.name}' to webhook for candidate creation by ${actingUserName} (ID: ${actingUserId}). Webhook status: ${webhookResponse.status}. Target Position ID: ${targetPositionId || 'N/A'}.`, 'API:Candidates:Create', actingUserId, { fileName: file.name, webhookError: errorBody, targetPositionId });
      return NextResponse.json({ message: `Failed to send PDF to workflow. Webhook responded with status ${webhookResponse.status}.`, errorDetails: errorBody }, { status: webhookResponse.status });
    }
  } catch (error) {
    console.error('Error processing PDF upload for candidate creation:', error);
    await logAudit('ERROR', `Error processing PDF upload for candidate creation by ${actingUserName} (ID: ${actingUserId}). Error: ${(error as Error).message}`, 'API:Candidates:Create', actingUserId);
    return NextResponse.json({ message: 'Error processing file upload', error: (error as Error).message }, { status: 500 });
  }
}
