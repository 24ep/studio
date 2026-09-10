import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { employeeContext, publishedLegalDocument } from '@/lib/privacy-support';
import { logAudit } from '@/lib/auditLog';

const legalTypes = new Set(['privacy_policy', 'terms_of_service']);

export async function GET(_: NextRequest, context: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { type } = await context.params;
  if (!legalTypes.has(type)) return NextResponse.json({ message: 'Unknown legal document type' }, { status: 404 });
  const document = await publishedLegalDocument(type, session.user.id);
  return NextResponse.json({ document });
}

export async function POST(_: NextRequest, context: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { type } = await context.params;
  if (!legalTypes.has(type)) return NextResponse.json({ message: 'Unknown legal document type' }, { status: 404 });
  const document = await publishedLegalDocument(type, session.user.id);
  if (!document?.id) return NextResponse.json({ message: 'No published document is available' }, { status: 404 });
  const employee = await employeeContext(session.user);
  await prisma.$executeRawUnsafe(
    `INSERT INTO legal_document_acknowledgments (id, document_id, user_id, employee_id)
     VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid)
     ON CONFLICT (document_id, user_id) DO NOTHING`,
    document.id,
    session.user.id,
    employee.id,
  );
  await logAudit('AUDIT', `Legal document acknowledged: ${type}.`, 'API:PrivacySupport:Legal', session.user.id, { documentId: document.id });
  return NextResponse.json({ success: true });
}
