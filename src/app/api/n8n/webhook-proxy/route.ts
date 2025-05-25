
// src/app/api/n8n/webhook-proxy/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserProfile } from '@/lib/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as UserProfile).role !== 'Admin') {
    // For now, only Admins can use this generic proxy. Adjust roles as needed.
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  const n8nWebhookUrl = process.env.N8N_GENERIC_PDF_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.error('N8N_GENERIC_PDF_WEBHOOK_URL not configured on the server.');
    return NextResponse.json({ message: "N8N webhook integration is not configured on the server." }, { status: 500 });
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

    // Convert file to base64 data URI to send in JSON payload to n8n
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const payload = {
      fileName: file.name,
      mimeType: file.type,
      fileDataUri: dataUri,
      uploadedBy: {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
      },
      timestamp: new Date().toISOString(),
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
      return NextResponse.json({ message: 'PDF successfully sent to n8n workflow.', n8nResponse: n8nResponseBody }, { status: 200 });
    } else {
      const errorBody = await n8nResponse.text();
      console.error(`Failed to proxy PDF to n8n. n8n status: ${n8nResponse.status}, Body: ${errorBody}`);
      return NextResponse.json({ message: `Failed to send PDF to n8n workflow. n8n responded with status ${n8nResponse.status}.`, errorDetails: errorBody }, { status: n8nResponse.status });
    }
  } catch (error) {
    console.error('Error processing generic PDF upload to n8n:', error);
    return NextResponse.json({ message: 'Error processing file upload', error: (error as Error).message }, { status: 500 });
  }
}
