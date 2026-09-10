import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  // SECURITY: Validate UUID format to prevent injection attacks
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('[SECURITY] Invalid UUID format in upload-queue file request:', id);
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }
  
  const client = await getPool().connect();
  
  try {
    // Fetch the upload queue item
    const res = await client.query('SELECT * FROM upload_queue WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const item = res.rows[0];
    let filePath = item.file_path;

    // SECURITY: Sanitize file path to prevent path traversal attacks
    const { sanitizePath } = await import('@/lib/security');
    filePath = sanitizePath(filePath);
    
    // SECURITY: Additional validation - ensure path doesn't contain parent directory references
    if (filePath.includes('..') || filePath.includes('//') || path.isAbsolute(filePath) && !filePath.startsWith('/uploads/')) {
      console.error('[SECURITY] Path traversal attempt detected:', item.file_path);
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // SECURITY: For MinIO paths, validate they start with expected prefixes
    // All uploads should be in uploads/ directory
    if (!filePath.startsWith('uploads/')) {
      console.error('[SECURITY] Invalid file path outside uploads directory:', filePath);
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Note: For MinIO storage, we should use MinIO client, not filesystem
    // This endpoint appears to be for local file storage (legacy)
    // For production, files should be served via MinIO signed URLs or secure-file endpoints
    try {
      // Check if file exists (only for local filesystem)
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      // Read the file
      const fileBuffer = await readFile(filePath);
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(fileName).toLowerCase();

    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (['.pdf'].includes(fileExtension)) {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(fileExtension)) {
      contentType = 'image/jpeg';
    } else if (['.png'].includes(fileExtension)) {
      contentType = 'image/png';
    } else if (['.gif'].includes(fileExtension)) {
      contentType = 'image/gif';
    } else if (['.doc', '.docx'].includes(fileExtension)) {
      contentType = 'application/msword';
    } else if (['.txt'].includes(fileExtension)) {
      contentType = 'text/plain';
    }

      // Return the file with appropriate headers
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('Error serving file:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in upload-queue file route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
