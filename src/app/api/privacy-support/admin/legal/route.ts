import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { isPrivacySupportAdmin } from '@/lib/privacy-support';
import { logAudit } from '@/lib/auditLog';

const schema = z.object({
  id: z.string().uuid().optional(),
  documentType: z.enum(['privacy_policy', 'terms_of_service']),
  title: z.string().trim().min(4).max(180),
  version: z.string().trim().min(1).max(40),
  content: z.string().trim().min(50).max(100000),
  effectiveAt: z.string().datetime().nullable().optional(),
  action: z.enum(['save', 'publish', 'archive']).default('save'),
});

async function actor() {
  const session = await auth();
  return session?.user && isPrivacySupportAdmin(session.user) ? session.user : null;
}

export async function GET() {
  const user = await actor();
  if (!user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const documents = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT d.*, count(a.id)::int AS acknowledgment_count
       FROM legal_documents d LEFT JOIN legal_document_acknowledgments a ON a.document_id = d.id
      GROUP BY d.id ORDER BY d.document_type, d.created_at DESC`,
  );
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const user = await actor();
  if (!user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid legal document', errors: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  if (data.action === 'publish' && data.id) {
    await prisma.$transaction([
      prisma.$executeRawUnsafe(`UPDATE legal_documents SET status = 'archived', updated_at = now() WHERE document_type = $1 AND status = 'published' AND id <> $2::uuid`, data.documentType, data.id),
      prisma.$executeRawUnsafe(`UPDATE legal_documents SET title = $1, version = $2, content = $3, effective_at = $4::timestamptz, status = 'published', published_by_id = $5::uuid, published_at = now(), updated_at = now() WHERE id = $6::uuid`, data.title, data.version, data.content, data.effectiveAt || new Date().toISOString(), user.id, data.id),
    ]);
  } else if (data.id) {
    await prisma.$executeRawUnsafe(
      `UPDATE legal_documents SET title = $1, version = $2, content = $3, effective_at = $4::timestamptz,
       status = $5, updated_at = now() WHERE id = $6::uuid`,
      data.title, data.version, data.content, data.effectiveAt || null, data.action === 'archive' ? 'archived' : 'draft', data.id,
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO legal_documents (id, document_type, title, version, content, status, effective_at, created_by_id, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'draft', $5::timestamptz, $6::uuid, now())`,
      data.documentType, data.title, data.version, data.content, data.effectiveAt || null, user.id,
    );
  }
  await logAudit('AUDIT', `Legal document ${data.action}.`, 'API:PrivacySupport:Admin:Legal', user.id, { documentType: data.documentType, id: data.id });
  return NextResponse.json({ success: true });
}
