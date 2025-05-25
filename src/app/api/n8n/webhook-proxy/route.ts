
// src/app/api/n8n/webhook-proxy/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

export async function POST(request: NextRequest) {
  const n8nWebhookUrl = process.env.N8N_GENERIC_PDF_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.error('N8N_GENERIC_PDF_WEBHOOK_URL not configured on the server.');
    await logAudit('ERROR', `Attempt to use n8n generic PDF upload failed: N8N_GENERIC_PDF_WEBHOOK_URL not configured.`, 'API:N8NProxy', null);
    return NextResponse.json({ message: "n8n integration for generic PDF processing is not configured on the server." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('pdfFile') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No PDF file provided in the "pdfFile" field' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }, { status: 400 });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only PDF is allowed for this endpoint.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const payload = {
      fileName: file.name,
      mimeType: file.type,
      fileDataUri: dataUri,
      timestamp: new Date().toISOString(),
      sourceApplication: 'NCC Candidate Management'
    };

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (n8nResponse.ok) {
      console.log(`Successfully proxied PDF to n8n: ${file.name}`);
      const n8nResponseBody = await n8nResponse.json().catch(() => ({ message: "Successfully sent to n8n, but no JSON response or n8n response was not JSON."}));
      await logAudit('AUDIT', `PDF '${file.name}' proxied to generic n8n workflow.`, 'API:N8NProxy', null, { fileName: file.name });
      return NextResponse.json({ message: 'PDF successfully sent to n8n workflow.', n8nResponse: n8nResponseBody }, { status: 200 });
    } else {
      const errorBody = await n8nResponse.text();
      console.error(`Failed to proxy PDF to n8n. n8n status: ${n8nResponse.status}, Body: ${errorBody}`);
      await logAudit('ERROR', `Failed to proxy PDF '${file.name}' to generic n8n workflow. Status: ${n8nResponse.status}.`, 'API:N8NProxy', null, { fileName: file.name, n8nError: errorBody});
      return NextResponse.json({ message: `Failed to send PDF to n8n workflow. n8n responded with status ${n8nResponse.status}.`, errorDetails: errorBody }, { status: n8nResponse.status });
    }
  } catch (error) {
    console.error('Error processing generic PDF upload to n8n:', error);
    await logAudit('ERROR', `Error processing generic PDF upload to n8n. Error: ${(error as Error).message}`, 'API:N8NProxy', null);
    return NextResponse.json({ message: 'Error processing file upload', error: (error as Error).message }, { status: 500 });
  }
}

    