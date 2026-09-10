import { NextResponse } from 'next/server';
import {
  createHeadcountAttachmentRecord,
} from './headcount-attachments-data';
import {
  buildHeadcountAttachmentStreamUrl,
  ensureHeadcountAttachmentBucket,
  removeHeadcountAttachmentObject,
  uploadHeadcountAttachmentObject,
} from './headcount-attachments-storage';

export async function ensureHeadcountAttachmentStorageReady() {
  try {
    await ensureHeadcountAttachmentBucket();
    return { ok: true as const };
  } catch (bucketError) {
    console.error('[HEADCOUNT ATTACHMENT] MinIO bucket check/creation failed:', bucketError);
    console.error('[HEADCOUNT ATTACHMENT] Bucket error details:', {
      message: bucketError instanceof Error ? bucketError.message : 'Unknown error',
      stack: bucketError instanceof Error ? bucketError.stack : undefined,
    });
    return {
      ok: false as const,
      response: NextResponse.json({
        error: 'Storage service is not available',
        details: bucketError instanceof Error ? bucketError.message : 'Unknown bucket error',
      }, { status: 503 }),
    };
  }
}

export async function uploadHeadcountAttachmentFile({
  headcountId,
  userId,
  file,
  objectName,
}: {
  headcountId: string;
  userId: string;
  file: File;
  objectName: string;
}) {
  try {
    await uploadHeadcountAttachmentObject({
      headcountId,
      user: { id: userId },
      file,
      objectName,
    });
    return { ok: true as const };
  } catch (minioError) {
    console.error('[HEADCOUNT ATTACHMENT] MinIO upload failed:', minioError);
    console.error('[HEADCOUNT ATTACHMENT] MinIO error details:', {
      message: minioError instanceof Error ? minioError.message : 'Unknown error',
      stack: minioError instanceof Error ? minioError.stack : undefined,
      objectName,
    });
    return {
      ok: false as const,
      response: NextResponse.json({
        error: 'Failed to upload file to storage',
        details: minioError instanceof Error ? minioError.message : 'Unknown MinIO error',
      }, { status: 500 }),
    };
  }
}

export async function createHeadcountAttachmentRecordResponse({
  headcountId,
  userId,
  file,
  label,
  objectName,
}: {
  headcountId: string;
  userId: string;
  file: File;
  label: string;
  objectName: string;
}) {
  try {
    const attachment = await createHeadcountAttachmentRecord({
      headcountId,
      uploadedById: userId,
      objectName,
      fileName: file.name,
      label,
    });

    return NextResponse.json({
      ...attachment,
      url: buildHeadcountAttachmentStreamUrl(objectName),
    }, { status: 201 });
  } catch (dbError) {
    console.error('[HEADCOUNT ATTACHMENT] Database creation failed:', dbError);
    console.error('[HEADCOUNT ATTACHMENT] Database error details:', {
      message: dbError instanceof Error ? dbError.message : 'Unknown error',
      stack: dbError instanceof Error ? dbError.stack : undefined,
    });

    try {
      await removeHeadcountAttachmentObject(objectName);
    } catch (cleanupError) {
      console.error('[HEADCOUNT ATTACHMENT] Failed to cleanup MinIO file:', cleanupError);
    }

    return NextResponse.json({
      error: 'Failed to save attachment record',
      details: dbError instanceof Error ? dbError.message : 'Unknown database error',
    }, { status: 500 });
  }
}
