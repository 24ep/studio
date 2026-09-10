import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import { hasPermission, isAdminUser } from "@/lib/permissions";
import { readRequestJsonResult } from "@/lib/request-json";
import { logAudit } from "@/lib/auditLog";
import {
  PAYROLL_APPROVAL_ROUTES_SETTING_KEY,
  PAYROLL_OPERATIONS_SETTING_KEY,
  getPayrollApprovalRoutes,
  getPayrollOperationsConfig,
  payrollApprovalRouteCatalogSchema,
  payrollOperationsConfigSchema,
} from "@/lib/payroll-approval-route-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user, "SYSTEM_SETTINGS_VIEW")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const actorCompany = isAdminUser(session.user)
    ? null
    : await getPool()
        .query<{ company_id: string | null }>(
          `SELECT company_id FROM hr_employees WHERE user_id = $1::uuid LIMIT 1`,
          [session.user.id],
        )
        .then((result) => result.rows[0]?.company_id || null);
  if (!isAdminUser(session.user) && !actorCompany)
    return NextResponse.json(
      { message: "A company assignment is required." },
      { status: 403 },
    );
  const [routes, operations, users, groups] = await Promise.all([
    getPayrollApprovalRoutes(),
    getPayrollOperationsConfig(),
    getPool()
      .query<{
        id: string;
        name: string;
        email: string;
        role: string;
        company_id: string | null;
      }>(
        `SELECT user_account.id, user_account.name, user_account.email, user_account.role, employee.company_id
           FROM "User" user_account LEFT JOIN hr_employees employee ON employee.user_id = user_account.id
          WHERE user_account.is_active = true AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
          ORDER BY user_account.name, user_account.email LIMIT 500`,
        [actorCompany],
      )
      .then((result) => result.rows),
    getPool()
      .query<{ id: string; name: string; code: string }>(
        `SELECT id, name, code FROM hr_payroll_groups WHERE status = 'active' AND ($1::uuid IS NULL OR company_id = $1::uuid) ORDER BY name LIMIT 500`,
        [actorCompany],
      )
      .then((result) => result.rows)
      .catch(() => []),
  ]);
  return NextResponse.json({ routes, operations, users, groups });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user, "SYSTEM_SETTINGS_EDIT")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (!isAdminUser(session.user))
    return NextResponse.json(
      {
        message:
          "Only a system administrator can change global payroll configuration.",
      },
      { status: 403 },
    );

  const body = await readRequestJsonResult(request);
  if (!body.ok)
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  const payload = body.value as { routes?: unknown; operations?: unknown };
  const parsedRoutes = payrollApprovalRouteCatalogSchema.safeParse(
    payload?.routes,
  );
  const parsedOperations = payrollOperationsConfigSchema.safeParse(
    payload?.operations,
  );
  if (!parsedRoutes.success || !parsedOperations.success) {
    return NextResponse.json(
      {
        message:
          parsedRoutes.error?.issues[0]?.message ||
          parsedOperations.error?.issues[0]?.message ||
          "Invalid payroll configuration",
      },
      { status: 400 },
    );
  }

  const approverIds = [
    ...new Set(
      parsedRoutes.data.flatMap((route) =>
        route.steps
          .map((step) => step.approverUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  ];
  const groupIds = [
    ...new Set(parsedRoutes.data.flatMap((route) => route.payrollGroupIds)),
  ];
  const [approvers, configuredGroups] = await Promise.all([
    getPool()
      .query<{ id: string; role: string; company_id: string | null }>(
        `SELECT user_account.id, user_account.role, employee.company_id FROM "User" user_account LEFT JOIN hr_employees employee ON employee.user_id = user_account.id WHERE user_account.is_active = true AND user_account.id = ANY($1::uuid[])`,
        [approverIds],
      )
      .then((result) => result.rows),
    getPool()
      .query<{ id: string; company_id: string | null }>(
        `SELECT id, company_id FROM hr_payroll_groups WHERE status = 'active' AND id = ANY($1::uuid[])`,
        [groupIds],
      )
      .then((result) => result.rows),
  ]);
  const approverMap = new Map(approvers.map((item) => [item.id, item]));
  const groupMap = new Map(configuredGroups.map((item) => [item.id, item]));
  for (const route of parsedRoutes.data) {
    const routeCompanies = new Set(
      route.payrollGroupIds
        .map((id) => groupMap.get(id)?.company_id)
        .filter(Boolean),
    );
    if (route.payrollGroupIds.some((id) => !groupMap.has(id)))
      return NextResponse.json(
        {
          message: `Route ${route.name} references an unavailable payroll group.`,
        },
        { status: 400 },
      );
    if (routeCompanies.size > 1)
      return NextResponse.json(
        {
          message: `Route ${route.name} cannot mix payroll groups from different companies.`,
        },
        { status: 400 },
      );
    for (const step of route.steps) {
      if (!step.approverUserId) continue;
      const approver = approverMap.get(step.approverUserId);
      if (!approver)
        return NextResponse.json(
          {
            message: `An approver in route ${route.name} is inactive or unavailable.`,
          },
          { status: 400 },
        );
      const routeCompany = [...routeCompanies][0];
      if (
        approver.role !== "Admin" &&
        (!routeCompany || approver.company_id !== routeCompany)
      )
        return NextResponse.json(
          {
            message: `Named approvers in route ${route.name} must belong to its payroll-group company. Use a role responsibility for global routes.`,
          },
          { status: 400 },
        );
    }
  }

  const pool = getPool();
  const [beforeRoutes, beforeOperations] = await Promise.all([
    getPayrollApprovalRoutes(),
    getPayrollOperationsConfig(),
  ]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
      [PAYROLL_APPROVAL_ROUTES_SETTING_KEY, JSON.stringify(parsedRoutes.data)],
    );
    await client.query(
      `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
      [PAYROLL_OPERATIONS_SETTING_KEY, JSON.stringify(parsedOperations.data)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  await logAudit(
    "AUDIT",
    "Payroll approval routes and operations policy updated.",
    "API:Settings:PayrollConfiguration:Update",
    session.user.id,
    {
      before: { routes: beforeRoutes, operations: beforeOperations },
      after: { routes: parsedRoutes.data, operations: parsedOperations.data },
    },
  );
  return NextResponse.json({
    routes: parsedRoutes.data,
    operations: parsedOperations.data,
  });
}
