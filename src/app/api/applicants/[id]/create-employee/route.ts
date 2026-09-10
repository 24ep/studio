import { randomUUID } from 'crypto';

import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { sendEmployeePasswordSetupEmail } from '@/lib/hr/employee-account-email';
import {
  EmployeeAccountConfigurationError,
  prismaTransactionQueryClient,
  provisionEmployeePlatformAccount,
  type PasswordSetupInvitation,
} from '@/lib/hr/employee-account-onboarding';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ApplicantEmployeeSourceRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  positionId: string | null;
  positionTitle: string | null;
};

type EmployeeNumberRow = {
  nextNumber: string | number | bigint | null;
};

type EmployeeRecordRow = {
  id: string;
  applicantId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  status: string;
};

type EmployeeAccountResponse = {
  userId: string;
  loginEmail: string;
  role: 'Employee';
  accountCreated: boolean;
  setupEmail?: {
    sent: boolean;
    error?: string;
  };
};

type CreateEmployeeBody = {
  created: boolean;
  message: string;
  employee: EmployeeRecordRow;
  account?: EmployeeAccountResponse;
};

function hasHrPeopleManagePermission(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, ['HR_PEOPLE_MANAGE'] as PlatformModuleId[]);
}

function splitApplicantName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || name.trim() || 'New';
  const lastName = parts.join(' ') || '-';
  return { firstName, lastName };
}

function formatEmployeeNumber(value: string | number | bigint | null | undefined) {
  const number = Number(value || 1);
  return `EMP-${String(Number.isFinite(number) ? number : 1).padStart(6, '0')}`;
}

async function getNextEmployeeNumber(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('hr_employees_employee_number'))`;
  const rows = await tx.$queryRaw<EmployeeNumberRow[]>`
    SELECT COALESCE(
      MAX(NULLIF(regexp_replace(employee_number, '\\D', '', 'g'), '')::integer),
      0
    ) + 1 AS "nextNumber"
    FROM hr_employees
    WHERE employee_number LIKE 'EMP-%'
  `;
  return formatEmployeeNumber(rows[0]?.nextNumber);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  if (!hasHrPeopleManagePermission(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const { id: applicantId } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const applicants = await tx.$queryRaw<ApplicantEmployeeSourceRow[]>`
        SELECT
          a.id,
          a.name,
          a.email,
          a.phone,
          a."positionId" AS "positionId",
          p.title AS "positionTitle"
        FROM "Applicant" a
        LEFT JOIN "Position" p ON p.id = a."positionId"
        WHERE a.id = ${applicantId}::uuid
        LIMIT 1
      `;
      const applicant = applicants[0];
      if (!applicant) {
        return { status: 404 as const, body: { message: 'Applicant not found.' } };
      }
      if (!applicant.email) {
        return { status: 400 as const, body: { message: 'Applicant email is required before creating an employee.' } };
      }
      const existing = await tx.$queryRaw<EmployeeRecordRow[]>`
        SELECT
          id,
          applicant_id AS "applicantId",
          employee_number AS "employeeNumber",
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          job_title AS "jobTitle",
          status
        FROM hr_employees
        WHERE applicant_id = ${applicant.id}::uuid
           OR lower(email) = lower(${applicant.email})
        ORDER BY CASE WHEN applicant_id = ${applicant.id}::uuid THEN 0 ELSE 1 END
        LIMIT 1
      `;
      if (existing[0]) {
        if (existing[0].applicantId && existing[0].applicantId !== applicant.id) {
          return {
            status: 409 as const,
            body: {
              created: false,
              message: 'An employee with this email is already linked to another applicant.',
              employee: existing[0],
            },
          };
        }

        if (!existing[0].applicantId) {
          await tx.$executeRaw`
            UPDATE hr_employees
            SET applicant_id = ${applicant.id}::uuid,
                position_id = ${applicant.positionId}::uuid,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existing[0].id}::uuid
          `;
          existing[0].applicantId = applicant.id;
        }

        const account = await provisionEmployeePlatformAccount(
          prismaTransactionQueryClient(tx),
          {
            employeeId: existing[0].id,
            employeeNumber: existing[0].employeeNumber,
            firstName: existing[0].firstName,
            lastName: existing[0].lastName,
            jobTitle: existing[0].jobTitle,
            deliveryEmail: applicant.email,
          },
        );
        existing[0].email = account.loginEmail;

        return {
          status: 200 as const,
          body: {
            created: false,
            message: 'Applicant is already linked to this employee.',
            employee: existing[0],
            account: {
              userId: account.userId,
              loginEmail: account.loginEmail,
              role: 'Employee' as const,
              accountCreated: account.accountCreated,
            },
          },
          invitation: account.invitation,
        };
      }

      const { firstName, lastName } = splitApplicantName(applicant.name);
      const employeeNumber = await getNextEmployeeNumber(tx);
      const employeeId = randomUUID();
      const hireDate = new Date();
      const targetDate = new Date(hireDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const employees = await tx.$queryRaw<EmployeeRecordRow[]>`
        INSERT INTO hr_employees (
          id,
          applicant_id,
          position_id,
          employee_number,
          first_name,
          last_name,
          email,
          phone,
          job_title,
          employment_type,
          status,
          hire_date,
          created_at,
          updated_at
        )
        VALUES (
          ${employeeId}::uuid,
          ${applicant.id}::uuid,
          ${applicant.positionId}::uuid,
          ${employeeNumber},
          ${firstName},
          ${lastName},
          ${applicant.email},
          ${applicant.phone},
          ${applicant.positionTitle},
          'full_time',
          'onboarding',
          ${hireDate},
          ${hireDate},
          ${hireDate}
        )
        RETURNING
          id,
          applicant_id AS "applicantId",
          employee_number AS "employeeNumber",
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          job_title AS "jobTitle",
          status
      `;
      const employee = employees[0];
      const onboardingId = randomUUID();

      await tx.$executeRaw`
        INSERT INTO hr_employee_onboarding (
          id,
          employee_id,
          status,
          progress,
          start_date,
          target_date,
          created_at,
          updated_at
        )
        VALUES (
          ${onboardingId}::uuid,
          ${employee.id}::uuid,
          'not_started',
          0,
          ${hireDate},
          ${targetDate},
          ${hireDate},
          ${hireDate}
        )
      `;

      const account = await provisionEmployeePlatformAccount(
        prismaTransactionQueryClient(tx),
        {
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          firstName: employee.firstName,
          lastName: employee.lastName,
          jobTitle: employee.jobTitle,
          deliveryEmail: applicant.email,
        },
      );
      employee.email = account.loginEmail;

      return {
        status: 201 as const,
        body: {
          created: true,
          message: 'Employee and platform account created.',
          employee,
          account: {
            userId: account.userId,
            loginEmail: account.loginEmail,
            role: 'Employee' as const,
            accountCreated: account.accountCreated,
          },
        },
        invitation: account.invitation,
      };
    });

    if ('invitation' in result && result.invitation) {
      const origin = process.env.NEXTAUTH_URL || process.env.AUTH_URL || request.nextUrl.origin;
      const emailResult = await sendEmployeePasswordSetupEmail(
        result.invitation as PasswordSetupInvitation,
        origin,
      );
      const body = result.body as CreateEmployeeBody;
      if (body.account) {
        body.account.setupEmail = {
          sent: emailResult.success,
          ...(emailResult.error ? { error: emailResult.error } : {}),
        };
      }
      if (!emailResult.success) {
        await logAudit(
          'WARN',
          'Employee platform account created, but the password setup email was not sent.',
          'API:Applicants:CreateEmployee',
          session.user.id,
          {
            applicantId,
            employeeId: body.employee.id,
            loginEmail: body.account?.loginEmail,
            emailError: emailResult.error,
          },
        );
      }
    }

    if (result.status === 201) {
      await logAudit(
        'AUDIT',
        'Employee created from applicant.',
        'API:Applicants:CreateEmployee',
        session.user.id,
        {
          applicantId,
          employee: result.body.employee,
          account: (result.body as CreateEmployeeBody).account,
        },
      );
    } else if (
      'account' in result.body
      && result.body.account?.accountCreated
    ) {
      await logAudit(
        'AUDIT',
        'Platform account created for an existing employee.',
        'API:Applicants:CreateEmployee',
        session.user.id,
        {
          applicantId,
          employeeId: result.body.employee.id,
          account: result.body.account,
        },
      );
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('[Applicants:create-employee] Failed:', error);
    if (error instanceof EmployeeAccountConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create employee from applicant.' },
      { status: 500 },
    );
  }
}
