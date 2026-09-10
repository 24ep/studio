import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/auditLog";
import { getPool } from "@/lib/db";
import { ensureBucketExists, minioClient, MINIO_BUCKET } from "@/lib/minio";
import { getPayrollAccess } from "@/lib/payroll/permissions";
import {
  PayrollFileSecurityError,
  verifyPayrollFile,
} from "@/lib/payroll/file-security";
import { getPayrollOperationsConfig } from "@/lib/payroll-approval-route-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DocumentRecord = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  objectName: string;
  uploadedAt: string;
  uploadedById: string;
};
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_BYTES = 15 * 1024 * 1024;

async function context(id: string, manage = false) {
  const session = await auth();
  if (!session?.user?.id)
    return {
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  const access = await getPayrollAccess(session.user);
  if (!(manage ? access.canManage : access.canView))
    return {
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  const result = await getPool().query<{
    eligibility_rules: Record<string, unknown>;
    company_id: string | null;
  }>(
    `SELECT eligibility_rules, company_id FROM hr_benefit_plans WHERE id = $1::uuid AND ($2::uuid IS NULL OR company_id = $2::uuid OR ($3::boolean = false AND company_id IS NULL))`,
    [id, access.actorCompanyId, manage],
  );
  if (!result.rowCount)
    return {
      response: NextResponse.json(
        { message: "Benefit plan not found" },
        { status: 404 },
      ),
    };
  const rules = result.rows[0].eligibility_rules || {};
  const documents = Array.isArray(rules.documents)
    ? (rules.documents as DocumentRecord[])
    : [];
  return { session, access, rules, documents };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resolved = await context(id);
  if ("response" in resolved) return resolved.response;
  const documentId = request.nextUrl.searchParams.get("documentId");
  if (!documentId)
    return NextResponse.json({
      documents: resolved.documents.map(
        ({ objectName: _objectName, ...document }) => document,
      ),
    });
  const document = resolved.documents.find((item) => item.id === documentId);
  if (!document)
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404 },
    );
  const stream = await minioClient.getObject(MINIO_BUCKET, document.objectName);
  await logAudit(
    "AUDIT",
    `Benefit plan document downloaded: ${document.name}`,
    "Payroll:BenefitDocument:Download",
    resolved.session.user.id,
    { benefitPlanId: id, documentId },
  );
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": document.contentType,
      "Content-Disposition": `attachment; filename="${document.name.replace(/["\r\n]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resolved = await context(id, true);
  if ("response" in resolved) return resolved.response;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size)
    return NextResponse.json(
      { message: "Choose a document to upload." },
      { status: 400 },
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { message: "Document must be 15 MB or smaller." },
      { status: 413 },
    );
  if (!ALLOWED_TYPES.has(file.type))
    return NextResponse.json(
      { message: "Upload a PDF, PNG, JPEG, or DOCX document." },
      { status: 415 },
    );
  const documentId = randomUUID();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-180);
  const objectName = `payroll/benefit-plans/${id}/${documentId}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let detected;
  try {
    detected = await verifyPayrollFile(
      buffer,
      ALLOWED_TYPES,
      Boolean((await getPayrollOperationsConfig()).requireMalwareScan),
    );
  } catch (error) {
    if (error instanceof PayrollFileSecurityError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    throw error;
  }
  await ensureBucketExists();
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": detected.mime,
    "x-amz-meta-uploaded-by": resolved.session.user.id,
  });
  const document: DocumentRecord = {
    id: documentId,
    name: file.name.slice(0, 240),
    contentType: detected.mime,
    size: file.size,
    objectName,
    uploadedAt: new Date().toISOString(),
    uploadedById: resolved.session.user.id,
  };
  const updated = await getPool().query(
    `UPDATE hr_benefit_plans
        SET eligibility_rules = jsonb_set(COALESCE(eligibility_rules, '{}'::jsonb), '{documents}',
              COALESCE(eligibility_rules->'documents', '[]'::jsonb) || $2::jsonb),
            version = version + 1, updated_at = now()
      WHERE id = $1::uuid AND ($3::uuid IS NULL OR company_id = $3::uuid)
      RETURNING id`,
    [id, JSON.stringify(document), resolved.access.actorCompanyId],
  );
  if (!updated.rowCount) {
    await minioClient
      .removeObject(MINIO_BUCKET, objectName)
      .catch(() => undefined);
    return NextResponse.json(
      { message: "Benefit plan changed or is no longer available." },
      { status: 409 },
    );
  }
  await logAudit(
    "AUDIT",
    `Benefit plan document uploaded: ${document.name}`,
    "Payroll:BenefitDocument:Upload",
    resolved.session.user.id,
    { benefitPlanId: id, documentId, size: file.size, contentType: file.type },
  );
  const { objectName: _objectName, ...responseDocument } = document;
  return NextResponse.json({ document: responseDocument }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resolved = await context(id, true);
  if ("response" in resolved) return resolved.response;
  const documentId = request.nextUrl.searchParams.get("documentId");
  const document = resolved.documents.find((item) => item.id === documentId);
  if (!document)
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404 },
    );
  const updated = await getPool().query(
    `UPDATE hr_benefit_plans
        SET eligibility_rules = jsonb_set(COALESCE(eligibility_rules, '{}'::jsonb), '{documents}',
              COALESCE((SELECT jsonb_agg(item) FROM jsonb_array_elements(COALESCE(eligibility_rules->'documents', '[]'::jsonb)) item WHERE item->>'id' <> $2), '[]'::jsonb)),
            version = version + 1, updated_at = now()
      WHERE id = $1::uuid AND ($3::uuid IS NULL OR company_id = $3::uuid)
        AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(eligibility_rules->'documents', '[]'::jsonb)) item WHERE item->>'id' = $2)
      RETURNING id`,
    [id, documentId, resolved.access.actorCompanyId],
  );
  if (!updated.rowCount)
    return NextResponse.json(
      { message: "Document was already removed." },
      { status: 409 },
    );
  await minioClient
    .removeObject(MINIO_BUCKET, document.objectName)
    .catch(async (error) => {
      await logAudit(
        "WARN",
        `Benefit document metadata removed but object cleanup failed: ${document.name}`,
        "Payroll:BenefitDocument:CleanupRequired",
        resolved.session.user.id,
        {
          benefitPlanId: id,
          documentId,
          objectName: document.objectName,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    });
  await logAudit(
    "AUDIT",
    `Benefit plan document deleted: ${document.name}`,
    "Payroll:BenefitDocument:Delete",
    resolved.session.user.id,
    { benefitPlanId: id, documentId },
  );
  return NextResponse.json({ success: true });
}
