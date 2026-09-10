import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { employeeContext } from '@/lib/privacy-support';
import { hasPermission } from '@/lib/permissions';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { deleteServiceDeskKnowledgeEmbeddings } from '@/lib/service-desk-knowledge';
import prisma from '@/lib/prisma';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const employee = await employeeContext(session.user);
  const { id } = await params;
  const rows = await prisma.$queryRawUnsafe<Array<{ storageKey: string | null }>>(
    `SELECT document.storage_key AS "storageKey"
       FROM service_desk_knowledge_documents document
       JOIN service_desk_categories category ON category.id = document.category_id
      WHERE document.id = $1::uuid AND category.company_id IS NOT DISTINCT FROM $2::uuid`,
    id,
    employee.companyId,
  );
  if (!rows[0]) return NextResponse.json({ message: 'Knowledge document not found.' }, { status: 404 });

  await prisma.$executeRawUnsafe(`DELETE FROM service_desk_knowledge_documents WHERE id = $1::uuid`, id);
  if (rows[0].storageKey) await minioClient.removeObject(MINIO_BUCKET, rows[0].storageKey).catch(() => undefined);
  await deleteServiceDeskKnowledgeEmbeddings(id).catch(() => undefined);
  return NextResponse.json({ success: true });
}
