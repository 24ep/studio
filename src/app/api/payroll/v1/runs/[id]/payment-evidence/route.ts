import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/auditLog";
import { getPool } from "@/lib/db";
import { ensureBucketExists, minioClient, MINIO_BUCKET } from "@/lib/minio";
import {
  canAccessPayrollSettlementEvidence,
  getPayrollAccess,
} from "@/lib/payroll/permissions";
import {
  PayrollFileSecurityError,
  verifyPayrollFile,
} from "@/lib/payroll/file-security";
import { getPayrollOperationsConfig } from "@/lib/payroll-approval-route-config";

export const runtime = "nodejs";
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg"]);

type EvidenceAccess = "manage" | "settlement";

async function runContext(id: string, required: EvidenceAccess) {
  const session = await auth();
  if (!session?.user?.id)
    return {
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  const access = await getPayrollAccess(session.user);
  const allowed =
    required === "manage"
      ? access.canManage
      : canAccessPayrollSettlementEvidence(access);
  if (!allowed)
    return {
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  const run = await getPool().query<{
    status: string;
    file_path: string | null;
  }>(
    `SELECT run.status, batch.file_path FROM hr_payroll_runs run
       LEFT JOIN hr_payroll_payment_batches batch ON batch.payroll_run_id = run.id
      WHERE run.id = $1::uuid AND ($2::uuid IS NULL OR run.company_id = $2::uuid)`,
    [id, access.actorCompanyId],
  );
  if (!run.rowCount)
    return {
      response: NextResponse.json(
        { message: "Payroll run not found" },
        { status: 404 },
      ),
    };
  return { session, run: run.rows[0] };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resolved = await runContext(id, "manage");
  if ("response" in resolved) return resolved.response;
  if (!["finalized", "payment_processing"].includes(resolved.run.status))
    return NextResponse.json(
      {
        message:
          "Payment evidence can only be attached after payroll is finalized.",
      },
      { status: 409 },
    );
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !file.size)
    return NextResponse.json(
      { message: "Choose payment evidence." },
      { status: 400 },
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { message: "Evidence must be 15 MB or smaller." },
      { status: 413 },
    );
  if (!ALLOWED.has(file.type))
    return NextResponse.json(
      { message: "Evidence must be PDF, PNG, or JPEG." },
      { status: 415 },
    );
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-180);
  const objectName = `payroll/payment-evidence/${id}/${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let detected;
  try {
    detected = await verifyPayrollFile(
      buffer,
      ALLOWED,
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
    "x-amz-meta-original-name": file.name,
    "x-amz-meta-uploaded-by": resolved.session.user.id,
  });
  const previousObjectName = resolved.run.file_path;
  const updated = await getPool().query(
    `UPDATE hr_payroll_payment_batches SET file_path = $2, version = version + 1, updated_at = now()
      WHERE payroll_run_id = $1::uuid RETURNING id`,
    [id, objectName],
  );
  if (!updated.rowCount) {
    await minioClient
      .removeObject(MINIO_BUCKET, objectName)
      .catch(() => undefined);
    return NextResponse.json(
      {
        message: "Generate payroll outputs before attaching payment evidence.",
      },
      { status: 409 },
    );
  }
  if (previousObjectName && previousObjectName !== objectName)
    await minioClient
      .removeObject(MINIO_BUCKET, previousObjectName)
      .catch(() => undefined);
  await logAudit(
    "AUDIT",
    `Payment evidence uploaded for payroll run ${id}.`,
    "Payroll:PaymentEvidence:Upload",
    resolved.session.user.id,
    { payrollRunId: id, objectName, originalName: file.name, size: file.size },
  );
  return NextResponse.json({ evidenceReference: objectName, name: file.name });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resolved = await runContext(id, "settlement");
  if ("response" in resolved) return resolved.response;
  const result = await getPool().query<{ file_path: string | null }>(
    `SELECT file_path FROM hr_payroll_payment_batches WHERE payroll_run_id = $1::uuid ORDER BY created_at DESC LIMIT 1`,
    [id],
  );
  const objectName = result.rows[0]?.file_path;
  if (!objectName)
    return NextResponse.json(
      { message: "Payment evidence not found" },
      { status: 404 },
    );
  const stat = await minioClient.statObject(MINIO_BUCKET, objectName);
  const stream = await minioClient.getObject(MINIO_BUCKET, objectName);
  await logAudit(
    "AUDIT",
    `Payment evidence downloaded for payroll run ${id}.`,
    "Payroll:PaymentEvidence:Download",
    resolved.session.user.id,
    { payrollRunId: id },
  );
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": String(
        stat.metaData?.["content-type"] || "application/octet-stream",
      ),
      "Content-Disposition": 'attachment; filename="payment-evidence"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
