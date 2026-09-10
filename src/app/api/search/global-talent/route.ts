import { NextRequest, NextResponse } from "next/server";
import type { PoolClient, QueryResultRow } from "pg";
import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import { hasAnyPermission, isAdminUser } from "@/lib/permissions";
import type { PlatformModuleId } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatMeta(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" - ");
}

type ApplicantSearchRow = QueryResultRow & {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  positionTitle: string | null;
};

type PositionSearchRow = QueryResultRow & {
  id: string;
  title: string;
  department: string | null;
  isOpen: boolean;
  recruiterName: string | null;
};

type UserSearchRow = QueryResultRow & {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

type HrisSearchRow = QueryResultRow & {
  id: string;
  type: "employee" | "payroll" | "expense" | "learning" | "performance" | "appraisal" | "case" | "task" | "setting";
  title: string;
  subtitle: string | null;
  domain: string;
  status: string | null;
  deepLink: string;
  meta: string | null;
};

async function safeRows<T extends QueryResultRow>(
  client: PoolClient,
  enabled: boolean,
  sql: string,
  values: unknown[],
): Promise<T[]> {
  if (!enabled) return [];
  try {
    return (await client.query<T>(sql, values)).rows;
  } catch (error) {
    console.warn("[global-talent-search] domain unavailable", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const query = (request.nextUrl.searchParams.get("q") || "").trim();

  if (query.length < 2) {
    return NextResponse.json({
      query,
      results: {
        applicants: [],
        positions: [],
        users: [],
        hris: [],
      },
    });
  }

  const client = await getPool().connect();

  try {
    const applicantSearch = `%${query}%`;
    const user = session.user;
    const canSearchRecruitment = hasAnyPermission(user, [
      "APPLICANTS_VIEW",
      "APPLICANTS_VIEW_ALL",
      "POSITIONS_VIEW",
      "POSITIONS_VIEW_ALL",
    ] as PlatformModuleId[]);
    const canSearchUsers = hasAnyPermission(user, ["USERS_VIEW"] as PlatformModuleId[]);
    const canSearchPeople = hasAnyPermission(user, ["HR_PEOPLE_VIEW", "HR_PEOPLE_MANAGE"] as PlatformModuleId[]);
    const canSearchPayroll = hasAnyPermission(user, ["HR_PAYROLL_VIEW", "HR_PAYROLL_MANAGE"] as PlatformModuleId[]);
    const canSearchExpenses = hasAnyPermission(user, [
      "EXPENSES_VIEW", "EXPENSES_APPROVE", "EXPENSES_FINANCE", "EXPENSES_AUDIT", "EXPENSES_ADMIN",
    ] as PlatformModuleId[]);
    const canSearchLearning = hasAnyPermission(user, ["HR_LEARNING_VIEW", "HR_LEARNING_MANAGE"] as PlatformModuleId[]);
    const canSearchPerformance = hasAnyPermission(user, ["HR_PERFORMANCE_VIEW", "HR_PERFORMANCE_MANAGE"] as PlatformModuleId[]);
    const canSearchSettings = hasAnyPermission(user, ["SYSTEM_SETTINGS_VIEW"] as PlatformModuleId[]);

    const [applicantRows, positionRows, userRows, employeeRows, payrollRows, expenseRows, learningRows, performanceRows, appraisalRows, caseRows, taskRows] = await Promise.all([
      safeRows<ApplicantSearchRow>(client, canSearchRecruitment,
        `
          SELECT
            a.id,
            a.name,
            a.email,
            rs.name AS status,
            p.title AS "positionTitle"
          FROM "Applicant" a
          LEFT JOIN "RecruitmentStage" rs ON rs.id = a."statusId"
          LEFT JOIN "Position" p ON p.id = a."positionId"
          WHERE
            a.name ILIKE $1 OR
            a.email ILIKE $1 OR
            a.phone ILIKE $1 OR
            p.title ILIKE $1
          ORDER BY a."updatedAt" DESC NULLS LAST, a."createdAt" DESC NULLS LAST
          LIMIT 8
        `,
        [applicantSearch],
      ),
      safeRows<PositionSearchRow>(client, canSearchRecruitment,
        `
          SELECT
            p.id,
            p.title,
            p.department,
            p."isOpen",
            u.name AS "recruiterName"
          FROM "Position" p
          LEFT JOIN "User" u ON u.id = p."recruiterId"
          WHERE
            p.title ILIKE $1 OR
            COALESCE(p.department, '') ILIKE $1 OR
            COALESCE(u.name, '') ILIKE $1
          ORDER BY p."updatedAt" DESC NULLS LAST, p."createdAt" DESC NULLS LAST
          LIMIT 8
        `,
        [applicantSearch],
      ),
      safeRows<UserSearchRow>(client, canSearchUsers,
        `
          SELECT
            u.id,
            u.name,
            u.email,
            u.role
          FROM "User" u
          WHERE
            COALESCE(u.name, '') ILIKE $1 OR
            COALESCE(u.email, '') ILIKE $1 OR
            COALESCE(u.role, '') ILIKE $1
          ORDER BY u."updatedAt" DESC NULLS LAST, u."createdAt" DESC NULLS LAST
          LIMIT 8
        `,
        [applicantSearch],
      ),
      safeRows<HrisSearchRow>(client, canSearchPeople,
        `SELECT e.id, 'employee' AS type,
                CONCAT(e.first_name, ' ', e.last_name) AS title,
                CONCAT_WS(' - ', NULLIF(e.employee_number, ''), NULLIF(e.job_title, '')) AS subtitle,
                'People' AS domain, e.status, CONCAT('/people/', e.id) AS "deepLink",
                d.name AS meta
           FROM hr_employees e
           LEFT JOIN hr_departments d ON d.id = e.department_id
          WHERE CONCAT_WS(' ', e.first_name, e.last_name, e.preferred_name, e.employee_number, e.job_title, d.name) ILIKE $1
          ORDER BY e.updated_at DESC LIMIT 8`, [applicantSearch]),
      safeRows<HrisSearchRow>(client, canSearchPayroll,
        `SELECT r.id, 'payroll' AS type, CONCAT('Payroll run - ', p.name) AS title,
                CONCAT('Pay date ', TO_CHAR(p.pay_date, 'YYYY-MM-DD')) AS subtitle,
                'Payroll' AS domain, r.status, '/payroll/runs' AS "deepLink", NULL::text AS meta
           FROM hr_payroll_runs r JOIN hr_payroll_periods p ON p.id = r.period_id
          WHERE CONCAT_WS(' ', p.name, r.status) ILIKE $1
          ORDER BY r.updated_at DESC LIMIT 8`, [applicantSearch]),
      safeRows<HrisSearchRow>(client, canSearchExpenses,
        `SELECT c.id, 'expense' AS type, c.title, c.reference AS subtitle,
                'Expenses' AS domain, c.status, '/expenses/claims' AS "deepLink", c.payment_status AS meta
           FROM expense_claims c
          WHERE CONCAT_WS(' ', c.reference, c.title, c.status, c.payment_status) ILIKE $1
          ORDER BY c.updated_at DESC LIMIT 8`, [applicantSearch]),
      safeRows<HrisSearchRow>(client, canSearchLearning,
        `SELECT c.id, 'learning' AS type, c.title, c.category AS subtitle,
                'Learning' AS domain, CASE WHEN c.is_active THEN 'active' ELSE 'archived' END AS status,
                CONCAT('/learning/courses/', c.id) AS "deepLink", NULL::text AS meta
           FROM hr_learning_courses c
          WHERE CONCAT_WS(' ', c.title, c.category, c.description) ILIKE $1
          ORDER BY c.updated_at DESC LIMIT 8`, [applicantSearch]),
      safeRows<HrisSearchRow>(client, canSearchPerformance,
        `SELECT g.id, 'performance' AS type, g.title,
                CONCAT(e.first_name, ' ', e.last_name) AS subtitle,
                'Performance' AS domain, g.status, '/workforce/performance' AS "deepLink",
                CONCAT(g.progress, '%') AS meta
           FROM hr_performance_goals g JOIN hr_employees e ON e.id = g.employee_id
          WHERE CONCAT_WS(' ', g.title, g.description, e.first_name, e.last_name, g.status) ILIKE $1
          ORDER BY g.updated_at DESC LIMIT 8`, [applicantSearch]),
      safeRows<HrisSearchRow>(client, canSearchPerformance,
        `SELECT c.id, 'appraisal' AS type, c.name AS title, c.review_type AS subtitle,
                'Appraisal' AS domain, c.status, '/workforce/performance?tab=appraisal' AS "deepLink", NULL::text AS meta
           FROM hr_performance_cycles c
          WHERE CONCAT_WS(' ', c.name, c.description, c.review_type, c.status) ILIKE $1
          ORDER BY c.updated_at DESC LIMIT 8`, [applicantSearch]),
      safeRows<HrisSearchRow>(client, true,
        `SELECT s.id, 'case' AS type, s.subject AS title, s.request_number AS subtitle,
                'Service Desk' AS domain, s.status, '/service-desk' AS "deepLink", s.category AS meta
           FROM employee_support_requests s
          WHERE (s.requester_user_id = $2 OR s.assigned_to_user_id = $2)
            AND CONCAT_WS(' ', s.request_number, s.subject, s.category, s.status) ILIKE $1
          ORDER BY s.updated_at DESC LIMIT 8`, [applicantSearch, user.id]),
      safeRows<HrisSearchRow>(client, true,
        `SELECT t.id, 'task' AS type, t.subject AS title, t.summary AS subtitle,
                t.source_domain AS domain, t.status, t.deep_link AS "deepLink", t.priority AS meta
           FROM hr_workflow_tasks t
          WHERE (t.assignee_user_id = $2 OR ($3::boolean AND t.requester_user_id = $2))
            AND CONCAT_WS(' ', t.subject, t.summary, t.source_domain, t.status, t.priority) ILIKE $1
          ORDER BY t.updated_at DESC LIMIT 8`, [applicantSearch, user.id, isAdminUser(user)]),
    ]);

    const availableSettingRows = [
          { id: "organization", type: "setting", title: "Company Info", subtitle: "Organization and employee email domain", domain: "Settings", status: "available", deepLink: "/settings/system-settings?tab=organize", meta: null },
          { id: "email-server", type: "setting", title: "Notification delivery", subtitle: "Email server and sender identity", domain: "Settings", status: "available", deepLink: "/settings/system-settings?tab=email-server", meta: null },
          { id: "features", type: "setting", title: "Feature Flags", subtitle: "Controlled platform capabilities", domain: "Settings", status: "available", deepLink: "/settings/system-settings?tab=features", meta: null },
        ] satisfies HrisSearchRow[];
    const settingRows: HrisSearchRow[] = canSearchSettings
      ? availableSettingRows.filter(row => `${row.title} ${row.subtitle}`.toLowerCase().includes(query.toLowerCase()))
      : [];

    const hrisRows = [employeeRows, payrollRows, expenseRows, learningRows, performanceRows, appraisalRows, caseRows, taskRows, settingRows]
      .flat()
      .slice(0, 32);

    return NextResponse.json({
      query,
      results: {
        applicants: applicantRows.map((row) => ({
          id: row.id,
          type: "applicant",
          title: row.name || row.email || "Unnamed Applicant",
          subtitle: row.email || row.positionTitle || "Applicant",
          meta: formatMeta([row.positionTitle, row.status]),
        })),
        positions: positionRows.map((row) => ({
          id: row.id,
          type: "position",
          title: row.title,
          subtitle: row.department || (row.isOpen ? "Open position" : "Closed position"),
          meta: formatMeta([row.recruiterName, row.isOpen ? "Open" : "Closed"]),
        })),
        users: userRows.map((row) => ({
          id: row.id,
          type: "user",
          title: row.name || row.email || "Unnamed User",
          subtitle: row.email || "User",
          meta: row.role || undefined,
        })),
        hris: hrisRows.map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          subtitle: row.subtitle || undefined,
          domain: row.domain,
          status: row.status || undefined,
          deepLink: row.deepLink,
          meta: row.meta || undefined,
        })),
      },
    });
  } catch (error) {
    console.error("[global-talent-search] failed", error);
    return NextResponse.json({ error: "Failed to search talent data" }, { status: 500 });
  } finally {
    client.release();
  }
}
