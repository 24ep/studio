import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logAudit } from "@/lib/auditLog";
import prisma from "@/lib/prisma";
import { buildPayrollCsv } from "@/lib/payroll/csv-export";
import { getPayrollAccess } from "@/lib/payroll/permissions";
import { getPayrollOperationsConfig } from "@/lib/payroll-approval-route-config";
import {
  buildPnd1V1,
  buildSso110DetailCsv,
} from "@/lib/payroll/statutory-export";
import { payrollExportAllowedForRun } from "@/lib/payroll/workflow-rules";

type Row = Record<string, unknown>;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; type: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const access = await getPayrollAccess(session.user);
  if (!access.canExport)
    return NextResponse.json(
      { message: "Payroll export permission required." },
      { status: 403 },
    );
  const { id, type } = await context.params;
  const operations = await getPayrollOperationsConfig();
  if (!["bank", "accounting", "statutory", "sso"].includes(type))
    return NextResponse.json(
      { message: "Unsupported payroll export." },
      { status: 404 },
    );
  const runs = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT id, status, run_type FROM hr_payroll_runs WHERE id = $1::uuid AND ($2::uuid IS NULL OR company_id = $2::uuid)`,
    id,
    access.actorCompanyId,
  );
  if (!runs[0])
    return NextResponse.json(
      { message: "Payroll run not found." },
      { status: 404 },
    );
  if (
    !["payment_processing", "paid", "reconciled", "closed"].includes(
      String(runs[0].status),
    )
  )
    return NextResponse.json(
      { message: "Generate payroll outputs before downloading." },
      { status: 409 },
    );
  if (!payrollExportAllowedForRun(runs[0].run_type, type))
    return NextResponse.json(
      {
        message:
          "Reversal runs use a controlled recovery process. Bank and ordinary statutory exports are disabled; use the accounting correction export.",
      },
      { status: 409 },
    );

  let body: string;
  let contentType = "text/csv; charset=utf-8";
  let extension = "csv";
  let rowCount = 0;
  if (type === "bank") {
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT employee.employee_number, concat(employee.first_name, ' ', employee.last_name) employee_name,
              payment.amount, payment.currency, payment.payment_method,
              COALESCE(profile.bank_account_reference, payment.payment_destination) bank_account_reference, batch.reference batch_reference
         FROM hr_payroll_payments payment JOIN hr_payroll_payment_batches batch ON batch.id = payment.payment_batch_id
         JOIN hr_employees employee ON employee.id = payment.employee_id
         LEFT JOIN hr_employee_payroll_profiles profile ON profile.employee_id = employee.id AND profile.status = 'active'
        WHERE batch.payroll_run_id = $1::uuid ORDER BY employee.employee_number`,
      id,
    );
    rowCount = rows.length;
    if (operations.bankExportFormat === "custom_delimited") {
      extension = "txt";
      contentType = "text/plain; charset=utf-8";
      body = rows
        .map((row) =>
          [
            "1",
            row.batch_reference,
            row.bank_account_reference,
            Number(row.amount || 0).toFixed(2),
            row.employee_number,
            row.employee_name,
          ]
            .map((value) => String(value ?? "").replace(/[\r\n|]/g, " "))
            .join("|"),
        )
        .join("\r\n");
    } else {
      body = buildPayrollCsv(
        [
          "Employee number",
          "Employee name",
          "Amount",
          "Currency",
          "Payment method",
          "Bank account reference",
          "Batch reference",
        ],
        rows.map((row) => [
          row.employee_number,
          row.employee_name,
          row.amount,
          row.currency,
          row.payment_method,
          row.bank_account_reference,
          row.batch_reference,
        ]),
      );
    }
  } else if (type === "accounting") {
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT entry.reference, entry.accounting_date, entry.currency, line.account_type, line.account_code,
              line.description, line.debit, line.credit, line.cost_center, line.department_id, line.dimensions
         FROM hr_payroll_accounting_entries entry JOIN hr_payroll_accounting_lines line ON line.accounting_entry_id = entry.id
        WHERE entry.payroll_run_id = $1::uuid ORDER BY line.created_at, line.id`,
      id,
    );
    rowCount = rows.length;
    if (operations.accountingExportFormat === "json") {
      extension = "json";
      contentType = "application/json; charset=utf-8";
      body = JSON.stringify({ payrollRunId: id, entries: rows }, null, 2);
    } else {
      body = buildPayrollCsv(
        [
          "Reference",
          "Accounting date",
          "Currency",
          "Account type",
          "Account code",
          "Description",
          "Debit",
          "Credit",
          "Cost center",
          "Department",
          "Dimensions",
        ],
        rows.map((row) => [
          row.reference,
          row.accounting_date,
          row.currency,
          row.account_type,
          row.account_code,
          row.description,
          row.debit,
          row.credit,
          row.cost_center,
          row.department_id,
          JSON.stringify(row.dimensions || {}),
        ]),
      );
    }
  } else {
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT employee.employee_number, employee.first_name, employee.last_name, employee.personal_information,
              employee.address, employee.tax_information, employee.government_identification,
              concat(employee.first_name, ' ', employee.last_name) employee_name,
              period.name period_name, period.pay_date, item.gross_pay, item.taxable_income,
              COALESCE(SUM(line.amount) FILTER (WHERE line.component_code = 'TH_PIT'),0) pit_withholding,
              COALESCE(SUM(line.amount) FILTER (WHERE line.component_code = 'TH_SSO_EMPLOYEE'),0) employee_social_security,
              COALESCE(SUM(line.amount) FILTER (WHERE line.component_code = 'TH_SSO_EMPLOYER'),0) employer_social_security
         FROM hr_payroll_run_items item JOIN hr_payroll_runs run ON run.id = item.payroll_run_id
         JOIN hr_payroll_periods period ON period.id = run.period_id JOIN hr_employees employee ON employee.id = item.employee_id
         LEFT JOIN hr_payroll_calculation_lines line ON line.payroll_run_item_id = item.id
        WHERE item.payroll_run_id = $1::uuid
        GROUP BY employee.employee_number, employee.first_name, employee.last_name, employee.personal_information,
                 employee.address, employee.tax_information, employee.government_identification,
                 period.name, period.pay_date, item.gross_pay, item.taxable_income
        ORDER BY employee.employee_number`,
      id,
    );
    rowCount = rows.length;
    if (type === "sso") {
      body = buildSso110DetailCsv(rows);
    } else if (operations.statutoryExportFormat === "pnd1_v1") {
      if (!operations.employerTaxId)
        return NextResponse.json(
          {
            message:
              "Configure the employer tax ID in Admin Center before generating PND.1.",
          },
          { status: 409 },
        );
      extension = "txt";
      contentType = "text/plain; charset=utf-8";
      body = buildPnd1V1(rows, {
        employerTaxId: operations.employerTaxId || "",
        employerLegacyTaxId: operations.employerLegacyTaxId || "",
        employerBranchNumber: operations.employerBranchNumber || "0000",
      });
    } else {
      body = buildPayrollCsv(
        [
          "Employee number",
          "Employee name",
          "Period",
          "Pay date",
          "Taxable income",
          "PIT withholding",
          "Employee social security",
          "Employer social security",
        ],
        rows.map((row) => [
          row.employee_number,
          row.employee_name,
          row.period_name,
          row.pay_date,
          row.taxable_income,
          row.pit_withholding,
          row.employee_social_security,
          row.employer_social_security,
        ]),
      );
    }
  }
  const fileName =
    type === "sso"
      ? "SSO1-10-detail.csv"
      : type === "statutory" && operations.statutoryExportFormat === "pnd1_v1"
        ? "PND1.txt"
        : `payroll-${id.slice(0, 8)}-${type}.${extension}`;

  await logAudit(
    "AUDIT",
    `Payroll ${type} export downloaded.`,
    "Payroll:FinancialExport:Download",
    session.user.id,
    {
      payrollRunId: id,
      exportType: type,
      runType: runs[0].run_type,
      runStatus: runs[0].status,
      fileName,
      rowCount,
    },
  );

  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
