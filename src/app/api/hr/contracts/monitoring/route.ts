import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasAnyPermission, isAdminUser } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type MonitoringRow = Record<string, unknown> & {
  documentCount: number;
  completedDocumentCount: number;
  signedContractComplete: boolean;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'User session required.' } }, { status: 401 });
  }
  if (!hasAnyPermission(session.user, ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'])) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to monitor employee contracts.' } }, { status: 403 });
  }

  try {
    let companyId: string | null = null;
    if (!isAdminUser(session.user)) {
      const scopeRows = await prisma.$queryRaw<Array<{ companyId: string | null }>>`
        SELECT company_id AS "companyId"
        FROM hr_employees
        WHERE user_id = ${session.user.id}::uuid OR lower(email) = lower(${session.user.email ?? ''})
        ORDER BY CASE WHEN user_id = ${session.user.id}::uuid THEN 0 ELSE 1 END
        LIMIT 1
      `;
      companyId = scopeRows[0]?.companyId ?? null;
      if (!companyId) {
        return NextResponse.json({ error: { code: 'COMPANY_SCOPE_REQUIRED', message: 'A company-scoped employee account is required.' } }, { status: 403 });
      }
    }

    const values: unknown[] = [];
    const companyPredicate = companyId ? `AND employee.company_id = $${values.push(companyId)}::uuid` : '';
    const records = await prisma.$queryRawUnsafe<MonitoringRow[]>(
      `SELECT employee.id,
        employee.employee_number AS "employeeNumber",
        employee.first_name AS "firstName",
        employee.last_name AS "lastName",
        employee.email,
        employee.job_title AS "jobTitle",
        employee.employment_type AS "employmentType",
        client.name AS "clientName",
        client.client_code AS "clientCode",
        department.name AS "departmentName",
        employee.location,
        trim(concat(manager.first_name, ' ', manager.last_name)) AS "managerName",
        employee.hire_date AS "hireDate",
        employee.end_date AS "endDate",
        employee.contract_notice_days AS "contractNoticeDays",
        employee.profile_photo_url AS "employeeAvatarUrl",
        employee.status,
        COUNT(document.id) FILTER (WHERE document.status <> 'archived')::int AS "documentCount",
        COUNT(document.id) FILTER (WHERE document.status = 'complete')::int AS "completedDocumentCount",
        COALESCE(BOOL_OR(
          document.status = 'complete' AND (document.type = 'contract' OR document.category = 'contract')
        ), false) AS "signedContractComplete"
       FROM hr_employees employee
       LEFT JOIN hr_clients client ON client.id = employee.client_id
       LEFT JOIN hr_departments department ON department.id = employee.department_id
       LEFT JOIN hr_employees manager ON manager.id = employee.manager_id
       LEFT JOIN hr_employee_documents document ON document.employee_id = employee.id
       WHERE employee.employment_type <> 'full_time'
         ${companyPredicate}
       GROUP BY employee.id, client.name, client.client_code, department.name, manager.first_name, manager.last_name
       ORDER BY employee.end_date ASC NULLS FIRST, employee.last_name ASC, employee.first_name ASC`,
      ...values,
    );

    return NextResponse.json({ data: records, total: records.length });
  } catch (cause) {
    console.error('[HR:ContractMonitoring] Failed to load contract monitoring data', cause);
    return NextResponse.json({ error: { code: 'MONITORING_UNAVAILABLE', message: 'Unable to load contract monitoring data.' } }, { status: 500 });
  }
}
