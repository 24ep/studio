import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/auditLog";
import { buildPayrollCsv } from "@/lib/payroll/csv-export";
import { getPayrollAccess } from "@/lib/payroll/permissions";
import {
  getPayrollWorkspace,
  PayrollServiceError,
} from "@/lib/payroll/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const columns = [
  "employee_number",
  "employee_name",
  "department",
  "period_name",
  "gross_pay",
  "total_deductions",
  "net_pay",
  "currency",
  "status",
  "delivery_status",
  "published_at",
  "download_count",
  "last_downloaded_at",
] as const;

function serviceError(error: unknown) {
  if (error instanceof PayrollServiceError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }
  console.error("[Payslip register export] Unexpected failure", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Payslip release register export is temporarily unavailable.",
      },
    },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "User session required." } },
      { status: 401 },
    );
  }

  const access = await getPayrollAccess(session.user);
  if (!access.canExport) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Payroll export permission required.",
        },
      },
      { status: 403 },
    );
  }

  try {
    const requestedCompanyId = request.nextUrl.searchParams.get("companyId");
    const periodId = request.nextUrl.searchParams.get("periodId")?.trim() || "";
    const data = await getPayrollWorkspace(
      "payslips",
      access,
      requestedCompanyId,
    );
    const records = periodId
      ? data.records.filter(
          (row) =>
            String(row.payroll_period_id || row.period_id || row.id || "") ===
            periodId,
        )
      : data.records;
    const body = buildPayrollCsv(
      [...columns],
      records.map((row) => columns.map((column) => row[column] ?? "")),
    );

    await logAudit(
      "AUDIT",
      "Payslip release register exported.",
      "Payroll:Payslip:RegisterExport",
      session.user.id,
      {
        entity: "payslip_release_register",
        companyId: data.companyId,
        periodId: periodId || null,
        rowCount: records.length,
        format: "csv",
      },
    );

    return new NextResponse(`\uFEFF${body}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          'attachment; filename="payslip-release-register.csv"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return serviceError(error);
  }
}
