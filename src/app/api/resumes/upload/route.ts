import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET, MINIO_PUBLIC_BASE_URL } from '@/lib/minio';
import { getPool } from '@/lib/db';
import { randomUUID } from 'crypto';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/resumes/upload:
 *   post:
 *     summary: Upload a resume
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id;
  const actingUserName = session?.user?.name || session?.user?.email || 'System';

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to manage candidates (for resume uploads)
  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to upload resume by ${actingUserName}`, 'API:Resumes:Upload', actingUserId);
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to upload resumes' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const candidateId = url.searchParams.get('candidateId');
    if (!candidateId) {
      await logAudit('WARN', `Resume upload attempted without candidateId by ${actingUserName}`, 'API:Resumes:Upload', actingUserId);
      return NextResponse.json({ message: 'Missing candidateId' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('resume');
    if (!file || typeof file === 'string') {
      await logAudit('WARN', `Resume upload attempted without file by ${actingUserName} for candidate ${candidateId}`, 'API:Resumes:Upload', actingUserId, { candidateId });
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const ext = originalName.split('.').pop();
    const objectName = `resumes/${candidateId}/${randomUUID()}.${ext}`;

    // Upload to MinIO
    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
      'x-amz-meta-originalname': originalName,
    });

    // Update candidate in DB
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update candidate's resume path
      const updateQuery = `UPDATE "Candidate" SET "resumePath" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *;`;
      const result = await client.query(updateQuery, [objectName, candidateId]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        await logAudit('ERROR', `Resume upload failed - candidate not found by ${actingUserName}`, 'API:Resumes:Upload', actingUserId, { candidateId, fileName: originalName });
        return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
      }
      const candidate = result.rows[0];

      // Create resume history entry
      const historyQuery = `
        INSERT INTO "ResumeHistory" (id, "candidateId", "filePath", "originalFileName", "uploadedAt", "uploadedByUserId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW());
      `;
      await client.query(historyQuery, [randomUUID(), candidateId, objectName, originalName, actingUserId]);

      // Build webhook payload in requested format
      const webhookPayload = {
        inputs: {
          cv_url: `${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${objectName}`,
          candidate_id: candidateId,
          job_id: candidate.positionid || candidate.positionId || null, // support both casings
          filename: originalName,
          mimetype: file.type
        },
        response_mode: 'streaming',
        user: actingUserId
      };

      // Add to upload queue for webhook processing
      const queueId = randomUUID();
      await client.query(
        `INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path, webhook_payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          queueId,
          originalName,
          buffer.length,
          'queued',
          'single',
          null,
          actingUserId,
          objectName,
          JSON.stringify(webhookPayload)
        ]
      );

      await client.query('COMMIT');

      await logAudit('AUDIT', `Resume '${originalName}' uploaded for candidate '${candidate.name}' by ${actingUserName}`, 'API:Resumes:Upload', actingUserId, { 
        candidateId, 
        candidateName: candidate.name,
        fileName: originalName,
        fileSize: buffer.length,
        filePath: objectName 
      });

      return NextResponse.json({ message: 'Resume uploaded', candidate, file_path: objectName, url: `${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${objectName}` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Resume upload error:', error);
    await logAudit('ERROR', `Resume upload failed by ${actingUserName}. Error: ${(error as Error).message}`, 'API:Resumes:Upload', actingUserId, { 
      candidateId: new URL(request.url).searchParams.get('candidateId'),
      error: (error as Error).message 
    });
    return NextResponse.json({ message: (error as Error).message || 'Internal server error' }, { status: 500 });
  }
}
