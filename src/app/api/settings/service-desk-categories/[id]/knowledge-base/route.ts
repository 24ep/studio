import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { employeeContext } from '@/lib/privacy-support';
import { hasPermission } from '@/lib/permissions';
import { extractLearningDocument } from '@/lib/learning/learning-document-parser';
import { ensureBucketExists, minioClient, MINIO_BUCKET } from '@/lib/minio';
import prisma from '@/lib/prisma';
import {
  chunkKnowledgeText,
  deleteServiceDeskKnowledgeEmbeddings,
  upsertServiceDeskKnowledgeChunks,
} from '@/lib/service-desk-knowledge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const employee = await employeeContext(session.user);
  const { id: categoryId } = await params;
  const category = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM service_desk_categories
      WHERE id = $1::uuid AND company_id IS NOT DISTINCT FROM $2::uuid`,
    categoryId,
    employee.companyId,
  );
  if (!category[0]) return NextResponse.json({ message: 'Category not found.' }, { status: 404 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ message: 'Choose a knowledge-base document.' }, { status: 400 });

  try {
    const extracted = await extractLearningDocument(file);
    const chunks = chunkKnowledgeText(extracted.text);
    if (!chunks.length) return NextResponse.json({ message: 'No indexable content was found.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentHash = createHash('sha256').update(buffer).digest('hex');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'knowledge-document';
    const storageKey = `service-desk-knowledge/${employee.companyId || 'global'}/${categoryId}/${randomUUID()}-${safeName}`;
    const documentId = randomUUID();

    await ensureBucketExists();
    await minioClient.putObject(MINIO_BUCKET, storageKey, buffer, buffer.length, {
      'Content-Type': file.type || 'application/octet-stream',
      'x-amz-meta-category-id': categoryId,
      'x-amz-meta-uploaded-by': session.user.id,
    });

    const replaced = await prisma.$queryRawUnsafe<Array<{ id: string; storageKey: string | null }>>(
      `SELECT id, storage_key AS "storageKey"
         FROM service_desk_knowledge_documents
        WHERE category_id = $1::uuid AND file_name = $2`,
      categoryId,
      file.name,
    );

    await prisma.$transaction(async transaction => {
      await transaction.$executeRawUnsafe(
        `DELETE FROM service_desk_knowledge_documents
           WHERE category_id = $1::uuid AND file_name = $2`,
        categoryId,
        file.name,
      );
      await transaction.$executeRawUnsafe(
        `INSERT INTO service_desk_knowledge_documents
          (id, category_id, file_name, mime_type, size_bytes, content_hash, storage_key,
           status, chunk_count, uploaded_by_user_id, updated_at)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, 'ready', $8, $9::uuid, now())`,
        documentId,
        categoryId,
        file.name,
        file.type || 'application/octet-stream',
        file.size,
        contentHash,
        storageKey,
        chunks.length,
        session.user.id,
      );
    });

    try {
      await upsertServiceDeskKnowledgeChunks(documentId, categoryId, file.name, chunks);
      if (replaced[0]?.id) {
        await deleteServiceDeskKnowledgeEmbeddings(replaced[0].id);
      }
    } catch (indexError) {
      await Promise.allSettled([
        prisma.$executeRawUnsafe(`DELETE FROM service_desk_knowledge_documents WHERE id = $1::uuid`, documentId),
        minioClient.removeObject(MINIO_BUCKET, storageKey),
        ...(replaced[0]?.id ? [deleteServiceDeskKnowledgeEmbeddings(replaced[0].id)] : []),
      ]);
      throw indexError instanceof Error ? indexError : new Error('The knowledge-base document could not be indexed.');
    }

    if (replaced[0]?.storageKey && replaced[0].storageKey !== storageKey) {
      await minioClient.removeObject(MINIO_BUCKET, replaced[0].storageKey).catch(() => undefined);
    }

    return NextResponse.json({ id: documentId, fileName: file.name, chunkCount: chunks.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'The knowledge-base document could not be indexed.',
    }, { status: 400 });
  }
}
