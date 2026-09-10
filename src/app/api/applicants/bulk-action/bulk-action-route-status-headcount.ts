import { randomUUID } from 'crypto';

import {
  getConfiguredEmployeeEmailDomain,
  provisionEmployeePlatformAccount,
} from '@/lib/hr/employee-account-onboarding';
import {
  assignApplicantToHeadcountWithClient,
  validateApplicantHiringStatusWithClient,
} from './bulk-action-route-utils';
import type { BulkActionExecutionContext } from './bulk-action-route-types';
import type {
  ApplicantPermissionRow,
  HeadcountValidationResult,
} from './bulk-action-route-status-types';

export async function assignHeadcountsForHiredApplicants(
  context: BulkActionExecutionContext,
  applicantsToUpdate: ApplicantPermissionRow[],
  applicantsToReject: Record<string, unknown>[],
  headcountValidationResults: HeadcountValidationResult[],
  stageName: string | undefined
) {
  const { client } = context;
  const headcountAssignmentResults: Record<string, unknown>[] = [];
  const autoCloseResults: Record<string, unknown>[] = [];

  if (stageName !== 'Hired') {
    return { headcountAssignmentResults, autoCloseResults };
  }

  for (const result of headcountValidationResults) {
    if (!result.willAutoAssign) {
      continue;
    }

    try {
      const positionId = applicantsToUpdate.find((applicant) => applicant.id === result.applicantId)?.positionId;
      if (!positionId) {
        continue;
      }

      const assignmentAllowed = await revalidateHeadcountBeforeAssignment({
        client,
        result,
        positionId,
        applicantsToUpdate,
        applicantsToReject,
      });
      if (!assignmentAllowed) {
        continue;
      }

      const assignmentResult = await assignApplicantToHeadcountWithClient(client, result.applicantId, positionId);
      headcountAssignmentResults.push({
        applicantId: result.applicantId,
        success: assignmentResult.success,
        message: assignmentResult.message,
        headcountId: assignmentResult.headcountId,
      });

      if (assignmentResult.success && assignmentResult.autoCloseResult) {
        autoCloseResults.push({
          applicantId: result.applicantId,
          positionId,
          autoCloseResult: assignmentResult.autoCloseResult,
        });
      }

      if (assignmentResult.success) {
        const account = await createEmployeeOnboardingForHiredApplicant({
          client,
          applicantId: result.applicantId,
        });
        if (account?.invitation) {
          context.passwordSetupInvitations.push(account.invitation);
        }
      }
    } catch (error) {
      console.error(`Error assigning headcount for Applicant ${result.applicantId}:`, error);
      headcountAssignmentResults.push({
        applicantId: result.applicantId,
        success: false,
        message: 'Error assigning headcount',
      });
    }
  }

  return { headcountAssignmentResults, autoCloseResults };
}

async function createEmployeeOnboardingForHiredApplicant({
  client,
  applicantId,
}: {
  client: BulkActionExecutionContext['client'];
  applicantId: string;
}) {
  const applicantResult = await client.query<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    positionTitle: string | null;
    department: string | null;
  }>(`
    SELECT
      a.id,
      a.name,
      a.email,
      a.phone,
      p.title AS "positionTitle",
      p.department
    FROM "Applicant" a
    LEFT JOIN "Position" p ON p.id = a."positionId"
    WHERE a.id = $1
    LIMIT 1
  `, [applicantId]);
  const applicant = applicantResult.rows[0];
  if (!applicant?.email) return;
  const companyDomain = await getConfiguredEmployeeEmailDomain(client);

  const [firstName, ...restName] = applicant.name.trim().split(/\s+/);
  const lastName = restName.join(' ') || '-';
  const generatedEmployeeId = randomUUID();
  const employeeNumber = `APP-${applicant.id.slice(0, 8).toUpperCase()}`;

  const employeeResult = await client.query<{
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
  }>(`
    WITH linked_employee AS (
      UPDATE hr_employees
      SET applicant_id = COALESCE(applicant_id, $1::uuid),
          job_title = COALESCE($8, job_title),
          status = CASE WHEN status = 'inactive' THEN 'onboarding' ELSE status END,
          updated_at = NOW()
      WHERE applicant_id = $1::uuid
         OR (applicant_id IS NULL AND lower(email) = lower($6))
      RETURNING
        id,
        employee_number AS "employeeNumber",
        first_name AS "firstName",
        last_name AS "lastName",
        job_title AS "jobTitle"
    ),
    created_employee AS (
      INSERT INTO hr_employees (
        id,
        applicant_id,
        employee_number,
        first_name,
        last_name,
        email,
        phone,
        job_title,
        status,
        hire_date,
        created_at,
        updated_at
      )
      SELECT $2::uuid, $1::uuid, $3, $4, $5, $6, $7, $8, 'onboarding', NOW(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM linked_employee)
      RETURNING
        id,
        employee_number AS "employeeNumber",
        first_name AS "firstName",
        last_name AS "lastName",
        job_title AS "jobTitle"
    )
    SELECT id, "employeeNumber", "firstName", "lastName", "jobTitle" FROM linked_employee
    UNION ALL
    SELECT id, "employeeNumber", "firstName", "lastName", "jobTitle" FROM created_employee
    LIMIT 1
  `, [
    applicant.id,
    generatedEmployeeId,
    employeeNumber,
    firstName || applicant.name,
    lastName,
    applicant.email,
    applicant.phone,
    applicant.positionTitle,
  ]);

  const employee = employeeResult.rows[0];
  if (!employee) return;

  const onboardingId = randomUUID();
  await client.query(`
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
    SELECT $1::uuid, $2::uuid, 'not_started', 0, NOW(), NOW() + INTERVAL '14 days', NOW(), NOW()
    WHERE NOT EXISTS (
      SELECT 1
      FROM hr_employee_onboarding
      WHERE employee_id = $2::uuid
        AND status IN ('not_started', 'in_progress')
    )
  `, [onboardingId, employee.id]);

  return provisionEmployeePlatformAccount(client, {
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    jobTitle: employee.jobTitle,
    deliveryEmail: applicant.email,
  }, companyDomain);
}

async function revalidateHeadcountBeforeAssignment({
  client,
  result,
  positionId,
  applicantsToUpdate,
  applicantsToReject,
}: {
  client: BulkActionExecutionContext['client'];
  result: HeadcountValidationResult;
  positionId: string;
  applicantsToUpdate: ApplicantPermissionRow[];
  applicantsToReject: Record<string, unknown>[];
}) {
  const revalidation = await validateApplicantHiringStatusWithClient(client, result.applicantId, positionId);
  if (revalidation.canHire) {
    return true;
  }

  console.warn(`Race condition detected: Headcount became unavailable for Applicant ${result.applicantId} during assignment. Rejecting Applicant.`, {
    applicantId: result.applicantId,
    positionId,
    originalValidation: result.validation,
    revalidation,
    timestamp: new Date().toISOString(),
  });

  applicantsToReject.push({
    applicantId: result.applicantId,
    reason: revalidation.reason,
    message: `Headcount became unavailable: ${revalidation.message}`,
    headcountStatus: revalidation.headcountStatus,
  });

  const rejectIndex = applicantsToUpdate.findIndex((applicant) => applicant.id === result.applicantId);
  if (rejectIndex !== -1) {
    applicantsToUpdate.splice(rejectIndex, 1);
  }

  return false;
}
