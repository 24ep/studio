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
  "period_name",
  "pay_date",
  "run_type",
  "status",
  "employee_count",
  "gross_total",
  "total_deductions",
  "net_total",
  "employer_cost",
  "payment_status",
  "accounting_status",
  "reconciliation_status",
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
  console.error("[Payroll register export] Unexpected failure", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Payroll register export is temporarily unavailable.",
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
    const data = await getPayrollWorkspace(
      "reports",
      access,
      requestedCompanyId,
    );
    const body = buildPayrollCsv(
      [...columns],
      data.records.map((row) => columns.map((column) => row[column] ?? "")),
    );

    await logAudit(
      "AUDIT",
      "Payroll register exported.",
      "Payroll:Report:Export",
      session.user.id,
      {
        entity: "payroll_register",
        companyId: data.companyId,
        rowCount: data.records.length,
        format: "csv",
      },
    );

    return new NextResponse(`\uFEFF${body}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="payroll-register.csv"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return serviceError(error);
  }
}
