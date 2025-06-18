
// src/app/api/candidates/[id]/avatar/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET_NAME } from '../../../../lib/minio'; // Assuming a common bucket for now
import pool from '../../../../lib/db';
import type { Candidate } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id || null;
  const actingUserName = session?.user?.name || session?.user?.email || 'System (API Candidate Avatar Upload)';

  const candidateId = params.id;
  if (!candidateId) {
    return NextResponse.json({ message: 'Candidate ID is required.' }, { status: 400 });
  }

  // Permission check (e.g., only Admin or assigned Recruiter can upload avatar)
  if (!session || (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_MANAGE'))) {
    await logAudit('WARN', `Forbidden attempt to upload avatar for candidate ${candidateId} by ${actingUserName}.`, 'API:CandidateAvatar', actingUserId, { targetCandidateId: candidateId });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  let candidateDBRecord: Pick<Candidate, 'id' | 'name'> | null = null;
  try {
    const candidateQuery = 'SELECT id, name FROM "Candidate" WHERE id = $1';
    const candidateResult = await pool.query(candidateQuery, [candidateId]);
    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
    candidateDBRecord = candidateResult.rows[0];
  } catch (dbError: any) {
    console.error('Database error fetching candidate for avatar upload:', dbError);
    await logAudit('ERROR', `Database error fetching candidate (ID: ${candidateId}) for avatar upload. Error: ${dbError.message}`, 'API:CandidateAvatar', actingUserId, { targetCandidateId: candidateId });
    return NextResponse.json({ message: 'Error verifying candidate for avatar upload.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No avatar file provided in "avatar" field.' }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ message: `File size exceeds the limit of ${MAX_AVATAR_SIZE / (1024 * 1024)}MB.` }, { status: 400 });
    }

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only JPEG, PNG, WEBP, GIF are allowed.' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop() || 'png';
    const fileNameInMinio = `candidate-avatars/${candidateId}-${Date.now()}.${fileExtension}`;
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await minioClient.putObject(MINIO_BUCKET_NAME, fileNameInMinio, buffer, file.size, {
      'Content-Type': file.type,
    });

    const avatarUrl = `${process.env.MINIO_PUBLIC_URL || process.env.NEXT_PUBLIC_MINIO_URL || `http://localhost:9847`}/${MINIO_BUCKET_NAME}/${fileNameInMinio}`;
    // For dataAiHint, we can use a generic term or try to derive something from filename if needed,
    // but for avatars, a generic hint is usually fine or can be set manually.
    const dataAiHint = "profile person";

    const updateQuery = 'UPDATE "Candidate" SET "avatarUrl" = $1, "dataAiHint" = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING "avatarUrl", "dataAiHint";';
    const updateResult = await pool.query(updateQuery, [avatarUrl, dataAiHint, candidateId]);

    await logAudit('AUDIT', `Avatar '${fileNameInMinio}' uploaded for candidate '${candidateDBRecord.name}' (ID: ${candidateId}) by ${actingUserName}.`, 'API:CandidateAvatar', actingUserId, { targetCandidateId: candidateId, avatarUrl: avatarUrl });

    return NextResponse.json({ 
      message: 'Avatar uploaded successfully.', 
      avatarUrl: updateResult.rows[0].avatarUrl,
      dataAiHint: updateResult.rows[0].dataAiHint
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading candidate avatar:', error);
    await logAudit('ERROR', `Error uploading avatar for candidate '${candidateDBRecord?.name || 'Unknown'}' (ID: ${candidateId}) by ${actingUserName}. Error: ${error.message}`, 'API:CandidateAvatar', actingUserId, { targetCandidateId: candidateId });
    return NextResponse.json({ message: error.message || 'Error processing avatar upload' }, { status: 500 });
  }
}
