import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import { minioClient, MINIO_BUCKET, ensureBucketExists, getSignedUrl } from '@/lib/minio';
import { getExpenseAccess } from '@/lib/expenses/permissions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const maxBytes = 12 * 1024 * 1024;

async function receiptAccess(user: NonNullable<Session['user']>, claimId: string) {
  const employee = await getEmployeeForUser(user.id!, user.email) as unknown as { id: string; company_id: string | null } | null;
  const access = getExpenseAccess(user, Boolean(employee));
  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string;
    employee_id: string;
    company_id: string | null;
  }>>(
    `SELECT id, employee_id, company_id FROM expense_claims WHERE id = $1::uuid LIMIT 1`,
    claimId,
  );
  const claim = rows[0];
  if (!claim) throw new Error('NOT_FOUND');
  const ownsClaim = employee?.id === claim.employee_id;
  const sameCompany = !employee?.company_id || !claim.company_id || employee.company_id === claim.company_id;
  if (!ownsClaim && !(sameCompany && (access.canFinance || access.canAudit))) throw new Error('FORBIDDEN');
  return { claim, employee, access };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  try {
    const form = await request.formData();
    const claimId = String(form.get('claimId') || '');
    const claimItemId = form.get('claimItemId') ? String(form.get('claimItemId')) : null;
    const file = form.get('file');
    if (!claimId || !(file instanceof File)) {
      return NextResponse.json({ message: 'Choose a receipt and claim before uploading.' }, { status: 400 });
    }
    await receiptAccess(session.user, claimId);
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ message: 'Receipts must be JPG, PNG, WebP, or PDF files.' }, { status: 415 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ message: 'Receipt files must be 12 MB or smaller.' }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash('sha256').update(buffer).digest('hex');
    const duplicateRows = await prisma.$queryRawUnsafe<Array<{ id: string; claim_id: string }>>(
      `SELECT r.id, r.claim_id
       FROM expense_receipts r
       JOIN expense_claims c ON c.id = r.claim_id
       JOIN expense_claims target ON target.id = $1::uuid
       WHERE c.employee_id = target.employee_id AND r.sha256_hash = $2
       LIMIT 1`,
      claimId, hash,
    );
    const id = randomUUID();
    const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin';
    const objectName = `expenses/${claimId}/${id}.${extension}`;
    await ensureBucketExists();
    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
      'x-amz-meta-uploaded-by': session.user.id,
      'x-amz-meta-sha256': hash,
    });
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO expense_receipts
        (id, claim_id, claim_item_id, file_name, storage_path, mime_type, size_bytes,
         sha256_hash, uploaded_by_user_id, uploaded_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9::uuid, CURRENT_TIMESTAMP)
       RETURNING id, claim_id, claim_item_id, file_name, mime_type, size_bytes, uploaded_at`,
      id, claimId, claimItemId, file.name, objectName, file.type, file.size, hash, session.user.id,
    );
    const policyRows = await prisma.$queryRawUnsafe<Array<{ policy_results: unknown; receipt_count: unknown }>>(
      `SELECT c.policy_results, COUNT(r.id) AS receipt_count
       FROM expense_claims c
       LEFT JOIN expense_receipts r ON r.claim_id = c.id
       WHERE c.id = $1::uuid
       GROUP BY c.id`,
      claimId,
    );
    const policyResults = Array.isArray(policyRows[0]?.policy_results)
      ? policyRows[0].policy_results as Array<{ code?: string }>
      : [];
    const receiptRequirements = policyResults.filter(result => result.code === 'RECEIPT_REQUIRED').length;
    if (receiptRequirements > 0 && Number(policyRows[0]?.receipt_count || 0) >= receiptRequirements) {
      await prisma.$executeRawUnsafe(
        `UPDATE expense_claims
         SET policy_results = (
           SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
           FROM jsonb_array_elements(policy_results) item
           WHERE item->>'code' <> 'RECEIPT_REQUIRED'
         ),
         version = version + 1,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid`,
        claimId,
      );
    }
    await logAudit('AUDIT', 'Expense receipt uploaded', 'API:Expenses:Receipt', session.user.id, {
      receiptId: id,
      claimId,
      claimItemId,
      hash,
      possibleDuplicateReceiptId: duplicateRows[0]?.id || null,
    });
    return NextResponse.json({
      data: rows[0],
      duplicateWarning: duplicateRows.length > 0
        ? 'This file matches a receipt already submitted by the employee.'
        : null,
    }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN';
    if (code === 'NOT_FOUND') return NextResponse.json({ message: 'Claim not found.' }, { status: 404 });
    if (code === 'FORBIDDEN') return NextResponse.json({ message: 'You do not have access to this claim.' }, { status: 403 });
    return NextResponse.json({ message: 'The receipt could not be uploaded. Try again.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  try {
    const receiptId = request.nextUrl.searchParams.get('id');
    if (!receiptId) return NextResponse.json({ message: 'Receipt ID is required.' }, { status: 400 });
    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      claim_id: string;
      storage_path: string;
      file_name: string;
    }>>(
      `SELECT id, claim_id, storage_path, file_name FROM expense_receipts WHERE id = $1::uuid LIMIT 1`,
      receiptId,
    );
    const receipt = rows[0];
    if (!receipt) return NextResponse.json({ message: 'Receipt not found.' }, { status: 404 });
    await receiptAccess(session.user, receipt.claim_id);
    if (receipt.storage_path.startsWith('demo://')) {
      const content = `SYNTHETIC DEMO RECEIPT\nDemo Airways\nReceipt: DEMO-RCPT-0001\nAmount: THB 6,450.00\nNo real purchase or payment occurred.`;
      const url = `data:text/plain;base64,${Buffer.from(content).toString('base64')}`;
      return NextResponse.json({ data: { url, fileName: receipt.file_name, expiresInSeconds: 0 } }, {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
    const url = await getSignedUrl(receipt.storage_path, 300);
    await logAudit('AUDIT', 'Expense receipt accessed', 'API:Expenses:Receipt', session.user.id, {
      receiptId,
      claimId: receipt.claim_id,
    });
    return NextResponse.json({ data: { url, fileName: receipt.file_name, expiresInSeconds: 300 } }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN';
    if (code === 'FORBIDDEN') return NextResponse.json({ message: 'You do not have access to this receipt.' }, { status: 403 });
    return NextResponse.json({ message: 'The receipt could not be opened.' }, { status: 500 });
  }
}
