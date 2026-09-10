import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "node:path";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/auditLog";
import { NotificationService } from "@/lib/notificationService";
import { getPayrollAccess } from "@/lib/payroll/permissions";

type PayslipRow = Record<string, unknown>;

async function makePdf(lines: string[]) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: { Title: "Payslip", Producer: "HRI Payroll" },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.font(
    path.join(process.cwd(), "node_modules", "@fontsource", "noto-sans-thai", "files", "noto-sans-thai-thai-400-normal.woff"),
  );
  lines.forEach((line, index) =>
    doc.fontSize(index === 0 ? 18 : 10.5).text(line || " ", { lineGap: 4 }),
  );
  doc.end();
  return completed;
}

async function resolvePayslip(
  id: string,
  user: Parameters<typeof getPayrollAccess>[0],
) {
  const access = await getPayrollAccess(user);
  if (!access.canView && !access.actorEmployeeId)
    return { access, payslip: undefined };
  const rows = await prisma.$queryRawUnsafe<PayslipRow[]>(
    `SELECT payslip.*, period.name period_name, period.pay_date,
            employee.user_id, employee.employee_number, concat(employee.first_name, ' ', employee.last_name) employee_name,
            employee.company_id, department.name department_name
       FROM hr_payslips payslip JOIN hr_employees employee ON employee.id = payslip.employee_id
       LEFT JOIN hr_departments department ON department.id = employee.department_id
       LEFT JOIN hr_payroll_periods period ON period.id = payslip.payroll_period_id
      WHERE payslip.id = $1::uuid AND ($2::uuid IS NULL OR employee.company_id = $2::uuid)
        AND ($3::uuid IS NULL OR payslip.employee_id = $3::uuid) LIMIT 1`,
    id,
    access.actorCompanyId,
    access.canView ? null : access.actorEmployeeId,
  );
  return { access, payslip: rows[0] };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { payslip } = await resolvePayslip(id, session.user);
  if (!payslip || String(payslip.status) !== "released")
    return NextResponse.json(
      { message: "Released payslip not found." },
      { status: 404 },
    );
  const breakdown = Array.isArray(payslip.breakdown)
    ? (payslip.breakdown as Array<Record<string, unknown>>)
    : [];
  const document = await makePdf([
    "PAYSLIP",
    `Period: ${payslip.period_name || "-"}`,
    `Pay date: ${new Date(String(payslip.pay_date)).toLocaleDateString("en-GB")}`,
    "",
    `Employee: ${payslip.employee_name}`,
    `Employee number: ${payslip.employee_number}`,
    `Department: ${payslip.department_name || "-"}`,
    "",
    `Gross pay: ${Number(payslip.gross_pay).toFixed(2)} ${payslip.currency}`,
    `Total deductions: ${Number(payslip.total_deductions).toFixed(2)} ${payslip.currency}`,
    `Net pay: ${Number(payslip.net_pay).toFixed(2)} ${payslip.currency}`,
    "",
    ...breakdown
      .slice(0, 24)
      .map(
        (line) =>
          `${line.label || line.code}: ${Number(line.amount || 0).toFixed(2)}`,
      ),
  ]);
  await prisma.$executeRawUnsafe(
    `UPDATE hr_payslips SET download_count = download_count + 1, last_downloaded_at = now(), updated_at = now() WHERE id = $1::uuid`,
    id,
  );
  await logAudit(
    "AUDIT",
    "Payslip downloaded.",
    "Payroll:Payslip:Download",
    session.user.id,
    { entity: "payslip", entityId: id },
  );
  return new NextResponse(new Uint8Array(document), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="payslip-${String(payslip.employee_number)}-${id.slice(0, 8)}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { access, payslip } = await resolvePayslip(id, session.user);
  if (!access.canManage)
    return NextResponse.json(
      { message: "Payroll management permission required." },
      { status: 403 },
    );
  if (!payslip?.user_id)
    return NextResponse.json(
      { message: "Employee account is not linked." },
      { status: 409 },
    );
  await NotificationService.createNotification(
    String(payslip.user_id),
    {
      type: "payroll",
      title: "Your payslip is available",
      message: `${String(payslip.period_name || "Payroll")} is ready to view.`,
      data: { href: "/ess/payslips", payslipId: id },
    },
    session.user.id,
  );
  await logAudit(
    "AUDIT",
    "Payslip reminder sent.",
    "Payroll:Payslip:Reminder",
    session.user.id,
    { entity: "payslip", entityId: id },
  );
  return NextResponse.json({ sent: true });
}
