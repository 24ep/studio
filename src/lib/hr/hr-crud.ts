import { randomUUID } from 'crypto';

import { buildServerFileUrl } from '@/lib/fileUrls';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import prisma from '@/lib/prisma';
import { sanitizeFilename } from '@/lib/fileUtils';
import {
  buildHrResourceSchema,
  coerceHrFieldValue,
  getHrResourceConfig,
  type HrResourceConfig,
  type HrResourceField,
} from './hr-resource-registry';
import type { HrModuleKey } from './hr-module-config';
import { getLeaveBlockValidationError } from './leave-block-utils';
import { assertAllocationCanBeSaved } from './organization-headcount-allocation';

export type HrCrudRecord = Record<string, unknown> & { id: string };

export interface HrCrudResult {
  fields: HrResourceField[];
  records: HrCrudRecord[];
}

function quoteIdent(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function quoteTable(identifier: string) {
  return identifier
    .split('.')
    .map(part => quoteIdent(part))
    .join('.');
}

function rowToClientRecord(row: Record<string, unknown>, config: HrResourceConfig): HrCrudRecord {
  const record: HrCrudRecord = { id: String(row.id) };
  for (const field of config.fields) {
    record[field.name] = row[field.column];
  }
  record.createdAt = row.created_at;
  record.updatedAt = row.updated_at;
  if (config.key === 'people') {
    record.applicantId = row.applicant_id || null;
    record.applicant = row.applicant_profile || null;
    record.personProfileId = row.person_profile_id || null;
    record.personProfile = row.person_profile || null;
    record.onboardingStatus = row.onboarding_status || 'not_started';
    record.managerId = row.manager_id || null;
    record.departmentId = row.department_id || null;
    record.departmentName = row.department_name || null;
    record.managerName = row.manager_name || null;
    record.positionId = row.position_id || null;
    record.positionTitle = row.position_title || null;
    record.clientName = row.client_name || null;
    record.clientCode = row.client_code || null;
    record.probationPeriodDays = row.probation_period_days ?? null;
    record.probationEvaluationFrequencyDays = row.probation_evaluation_frequency_days ?? null;
    record.positionProbationPeriodDays = Number(row.position_probation_period_days || 90);
    record.positionProbationEvaluationFrequencyDays = Number(row.position_probation_evaluation_frequency_days || 30);
    record.accountUserId = row.account_user_id || null;
    record.accountEmail = row.account_email || null;
    record.accountName = row.account_name || null;
    record.employeeAvatarUrl = row.employee_avatar_url || null;
    record.accountRole = row.account_role || null;
    record.accountIsActive = row.account_is_active ?? null;
    record.accountForcePasswordChange = row.account_force_password_change ?? null;
    record.accountLastLogin = row.account_last_login
      ? new Date(row.account_last_login as string | number | Date).toISOString()
      : null;
    record.accountLinkedByEmail = Boolean(row.account_user_id) && row.account_linked_by_email === true;
    for (const [clientKey, databaseKey] of Object.entries({
      legalName: 'legal_name',
      businessUnit: 'business_unit',
      workPhone: 'work_phone',
      address: 'address',
      emergencyContacts: 'emergency_contacts',
      familyDependents: 'family_dependents',
      bankInformation: 'bank_information',
      taxInformation: 'tax_information',
      governmentIdentification: 'government_identification',
      education: 'education',
      workExperience: 'work_experience',
      skills: 'skills',
      certifications: 'certifications',
      languages: 'languages',
      profileCompletion: 'profile_completion',
    })) {
      record[clientKey] = row[databaseKey] ?? null;
    }
  }
  if (config.key === 'teams') {
    record.employeeCount = Number(row.employee_count || 0);
    record.headcountUsage = Number(row.headcount_usage || 0);
  }
  if (config.key === 'clients') {
    record.employeeCount = Number(row.employee_count || 0);
  }
  return record;
}

const peopleAccountJoin = `
       LEFT JOIN LATERAL (
         SELECT u.id, u.email, u.name, u.role, u."avatarUrl", u."is_active", u.force_password_change,
                (
                  SELECT activity.created_at
                  FROM "UserActivityLog" activity
                  WHERE activity.user_id = u.id AND activity.action = 'SIGN_IN'
                  ORDER BY activity.created_at DESC
                  LIMIT 1
                ) AS last_login,
                e."user_id" IS NULL AND lower(u.email) = lower(e.email) AS linked_by_email
         FROM "User" u
         WHERE u.id = e."user_id" OR lower(u.email) = lower(e.email)
         ORDER BY CASE WHEN u.id = e."user_id" THEN 0 ELSE 1 END
         LIMIT 1
       ) account_user ON true`;

async function getLinkedApplicantProfile(applicantId: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: {
      position: {
        select: {
          id: true,
          title: true,
          department: true,
          positionLevel: true,
          isOpen: true,
          grade: {
            select: {
              id: true,
              name: true,
              label: true,
              color: true,
            },
          },
        },
      },
      recruitmentStage: {
        select: {
          id: true,
          name: true,
          sortOrder: true,
          color_badge: true,
        },
      },
      source: {
        select: {
          id: true,
          name: true,
        },
      },
      recruiter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      transitionRecords: {
        orderBy: { date: 'desc' },
        include: {
          actingUser: {
            select: {
              id: true,
              name: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      personProfile: true,
    },
  });

  if (!applicant) return null;

  const attachments = await Promise.all(applicant.attachments.map(async attachment => ({
    ...attachment,
    url: await buildServerFileUrl(attachment.filePath, { strategy: 'stream' }),
  })));
  const isStageUuid = (stage: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stage);
  const stageIds = Array.from(new Set(
    applicant.transitionRecords
      .map(record => record.stage)
      .filter(isStageUuid),
  ));
  const transitionStages = stageIds.length > 0
    ? await prisma.recruitmentStage.findMany({
      where: { id: { in: stageIds } },
      select: { id: true, name: true, color_badge: true },
    })
    : [];
  const transitionStageById = new Map(transitionStages.map(stage => [stage.id, stage]));
  const transitionHistory = applicant.transitionRecords.map(record => {
    const resolvedStage = transitionStageById.get(record.stage);
    return {
      ...record,
      stageName: resolvedStage?.name ?? (isStageUuid(record.stage) ? 'Stage updated' : record.stage),
      stageColor: resolvedStage?.color_badge ?? null,
    };
  });
  const { transitionRecords, ...profile } = applicant;

  return {
    ...profile,
    attachments,
    transitionHistory,
  };
}

export async function listHrCrudRecords(moduleKey: HrModuleKey, view?: string | null): Promise<HrCrudResult> {
  const config = getHrResourceConfig(moduleKey, view);
  const columns = ['id', ...config.fields.filter(field => field.type !== 'file').map(field => field.column), 'created_at', 'updated_at'];
  const rows = config.key === 'people'
    ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ${columns.map(column => `e.${quoteIdent(column)}`).join(', ')}, e."applicant_id", e."person_profile_id", e."manager_id", e."department_id",
              e."position_id", e."probation_period_days", e."probation_evaluation_frequency_days",
              employee_position.title AS position_title,
              assigned_client.name AS client_name,
              assigned_client.client_code AS client_code,
              employee_position."probation_period_days" AS position_probation_period_days,
              employee_position."probation_evaluation_frequency_days" AS position_probation_evaluation_frequency_days,
              COALESCE(latest_onboarding.status, 'not_started') AS onboarding_status,
              account_user.id AS account_user_id,
              account_user.email AS account_email,
              account_user.name AS account_name,
              to_jsonb(shared_person) AS person_profile,
              COALESCE(account_user."avatarUrl", shared_person."avatar_url", linked_applicant."avatarUrl") AS employee_avatar_url,
              account_user.role AS account_role,
              account_user."is_active" AS account_is_active,
              account_user.force_password_change AS account_force_password_change,
              account_user.last_login AS account_last_login,
              account_user.linked_by_email AS account_linked_by_email
       FROM ${quoteTable(config.table)} e
       LEFT JOIN LATERAL (
         SELECT status
         FROM "hr_employee_onboarding"
         WHERE "employee_id" = e.id
         ORDER BY "updated_at" DESC
         LIMIT 1
       ) latest_onboarding ON true
       LEFT JOIN "Applicant" linked_applicant ON linked_applicant.id = e."applicant_id"
       LEFT JOIN "person_profiles" shared_person ON shared_person.id = e."person_profile_id"
       LEFT JOIN "Position" employee_position ON employee_position.id = e."position_id"
       LEFT JOIN "hr_clients" assigned_client ON assigned_client.id = e."client_id"
       ${peopleAccountJoin}
       ORDER BY e."updated_at" DESC
       LIMIT 100`,
    )
    : config.key === 'teams'
      ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT ${columns.map(column => `d.${quoteIdent(column)}`).join(', ')},
                COUNT(e.id)::int AS employee_count,
                (
                  WITH RECURSIVE descendants AS (
                    SELECT d.id
                    UNION ALL
                    SELECT child.id FROM "hr_departments" child
                    INNER JOIN descendants parent ON child."parent_id" = parent.id
                  )
                  SELECT COUNT(h.id)::int
                  FROM descendants
                  LEFT JOIN "Position" p ON p."organization_unit_id" = descendants.id
                  LEFT JOIN "Headcount" h ON h."positionId" = p.id AND h.status <> 'rejected'
                ) AS headcount_usage
         FROM ${quoteTable(config.table)} d
         LEFT JOIN "hr_employees" e ON e."department_id" = d.id
         GROUP BY ${columns.map(column => `d.${quoteIdent(column)}`).join(', ')}
         ORDER BY d."parent_id" NULLS FIRST, d."sort_order", d."name"`,
      )
    : config.key === 'clients'
      ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT ${columns.map(column => `c.${quoteIdent(column)}`).join(', ')},
                COUNT(e.id)::int AS employee_count
         FROM ${quoteTable(config.table)} c
         LEFT JOIN "hr_employees" e ON e."client_id" = c.id
         GROUP BY ${columns.map(column => `c.${quoteIdent(column)}`).join(', ')}
         ORDER BY c."updated_at" DESC
         LIMIT 100`,
      )
    : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ${columns.map(quoteIdent).join(', ')} FROM ${quoteTable(config.table)} ORDER BY "updated_at" DESC LIMIT 100`,
    );

  return {
    fields: config.fields,
    records: rows.map(row => rowToClientRecord(row, config)),
  };
}

export async function getHrCrudRecord(moduleKey: HrModuleKey, id: string, view?: string | null) {
  const config = getHrResourceConfig(moduleKey, view);
  const columns = ['id', ...config.fields.filter(field => field.type !== 'file').map(field => field.column), 'created_at', 'updated_at'];
  const rows = config.key === 'people'
    ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ${columns.map(column => `e.${quoteIdent(column)}`).join(', ')}, e."applicant_id", e."person_profile_id", e."manager_id", e."department_id",
              e."position_id", e."probation_period_days", e."probation_evaluation_frequency_days",
              e."legal_name", e."business_unit", e."work_phone", e."address", e."emergency_contacts",
              e."family_dependents", e."bank_information", e."tax_information", e."government_identification",
              e."education", e."work_experience", e."skills", e."certifications", e."languages", e."profile_completion",
              employee_department.name AS department_name,
              concat_ws(' ', COALESCE(employee_manager.preferred_name, employee_manager.first_name), employee_manager.last_name) AS manager_name,
              employee_position.title AS position_title,
              assigned_client.name AS client_name,
              assigned_client.client_code AS client_code,
              employee_position."probation_period_days" AS position_probation_period_days,
              employee_position."probation_evaluation_frequency_days" AS position_probation_evaluation_frequency_days,
              to_jsonb(linked_applicant) AS applicant_profile,
              to_jsonb(shared_person) AS person_profile,
              COALESCE(latest_onboarding.status, 'not_started') AS onboarding_status,
              account_user.id AS account_user_id,
              account_user.email AS account_email,
              account_user.name AS account_name,
              COALESCE(account_user."avatarUrl", shared_person."avatar_url", linked_applicant."avatarUrl") AS employee_avatar_url,
              account_user.role AS account_role,
              account_user."is_active" AS account_is_active,
              account_user.force_password_change AS account_force_password_change,
              account_user.last_login AS account_last_login,
              account_user.linked_by_email AS account_linked_by_email
       FROM ${quoteTable(config.table)} e
       LEFT JOIN LATERAL (
         SELECT status
         FROM "hr_employee_onboarding"
         WHERE "employee_id" = e.id
         ORDER BY "updated_at" DESC
         LIMIT 1
       ) latest_onboarding ON true
       LEFT JOIN "Applicant" linked_applicant ON linked_applicant.id = e."applicant_id"
       LEFT JOIN "person_profiles" shared_person ON shared_person.id = e."person_profile_id"
       LEFT JOIN "Position" employee_position ON employee_position.id = e."position_id"
       LEFT JOIN "hr_departments" employee_department ON employee_department.id = e."department_id"
       LEFT JOIN "hr_employees" employee_manager ON employee_manager.id = e."manager_id"
       LEFT JOIN "hr_clients" assigned_client ON assigned_client.id = e."client_id"
       ${peopleAccountJoin}
       WHERE e."id" = $1::uuid
       LIMIT 1`,
      id,
    )
    : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ${columns.map(quoteIdent).join(', ')} FROM ${quoteTable(config.table)} WHERE "id" = $1::uuid LIMIT 1`,
      id,
    );
  if (!rows[0]) return null;
  const record = rowToClientRecord(rows[0], config);
  if (config.key === 'people') {
    const [documents, linkedApplicant, profileRequests, onboarding, onboardingTasks] = await Promise.all([
      prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT id, title, type, status, file_path AS "filePath", expires_at AS "expiresAt", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM "hr_employee_documents"
         WHERE "employee_id" = $1::uuid AND status <> 'archived'
         ORDER BY "updated_at" DESC`,
        id,
      ),
      record.applicantId
        ? getLinkedApplicantProfile(String(record.applicantId))
        : Promise.resolve(null),
      prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT id, request_id AS "requestId", title, status, reason, requested_values AS "requestedValues",
                created_at AS "createdAt", updated_at AS "updatedAt"
         FROM "hr_ess_requests"
         WHERE "subject_employee_id" = $1::uuid AND "request_type" = 'profile_change'
         ORDER BY "created_at" DESC`,
        id,
      ),
      prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT eo.id, eo.template_id AS "templateId", eo.status, eo.progress, eo.start_date AS "startDate",
                eo.target_date AS "targetDate", eo.completed_at AS "completedAt",
                template.name AS "templateName", template.description AS "templateDescription"
         FROM "hr_employee_onboarding" eo
         LEFT JOIN "hr_onboarding_templates" template ON template.id = eo.template_id
         WHERE eo.employee_id = $1::uuid
         ORDER BY eo.updated_at DESC
         LIMIT 1`,
        id,
      ).catch(() => []),
      prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT task.id, task.title, task.description, task.detailed_instructions AS "detailedInstructions",
                task.tags, task.owner_role AS "ownerRole", task.is_required AS "isRequired",
                task.employee_visibility AS "employeeVisibility",
                task.due_day AS "dueDay", task.sort_order AS "sortOrder",
                COALESCE(progress.status, 'pending') AS status,
                progress.completed_at AS "completedAt"
         FROM "hr_employee_onboarding" eo
         JOIN "hr_onboarding_tasks" task ON task.template_id = eo.template_id
         LEFT JOIN "hr_employee_onboarding_task_progress" progress
           ON progress.onboarding_id = eo.id AND progress.task_id = task.id
         WHERE eo.id = (
           SELECT latest.id
           FROM "hr_employee_onboarding" latest
           WHERE latest.employee_id = $1::uuid
           ORDER BY latest.updated_at DESC
           LIMIT 1
         )
         ORDER BY task.sort_order ASC, task.created_at ASC`,
        id,
      ).catch(() => []),
    ]);
    record.documents = documents;
    record.applicant = linkedApplicant;
    record.profileRequests = profileRequests;
    record.onboarding = onboarding[0] || null;
    record.onboardingTasks = onboardingTasks;
  }
  return record;
}

async function linkPeopleRecordToAccountByEmail(config: HrResourceConfig, id: string) {
  if (config.key !== 'people') return;

  await prisma.$executeRawUnsafe(
    `UPDATE "hr_employees" e
     SET "user_id" = u.id, "updated_at" = CURRENT_TIMESTAMP
     FROM "User" u
     WHERE e.id = $1::uuid
       AND e."user_id" IS NULL
       AND lower(e.email) = lower(u.email)
       AND NOT EXISTS (
         SELECT 1
         FROM "hr_employees" existing
         WHERE existing."user_id" = u.id AND existing.id <> e.id
       )`,
    id,
  );
}

function buildPayloadFromPlainObject(config: HrResourceConfig, body: unknown, partial = false) {
  const schema = buildHrResourceSchema(config, partial);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten().fieldErrors };
  }
  return { ok: true as const, values: parsed.data as Record<string, unknown> };
}

export async function parseHrMutationPayload({
  request,
  moduleKey,
  partial = false,
  view,
}: {
  request: Request;
  moduleKey: HrModuleKey;
  partial?: boolean;
  view?: string | null;
}) {
  const config = getHrResourceConfig(moduleKey, view);
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    const body = await request.json().catch(() => null);
    const parsed = buildPayloadFromPlainObject(config, body, partial);
    if (parsed.ok && config.key === 'leaveBlocks') {
      const validationError = getLeaveBlockValidationError(parsed.values);
      if (validationError) {
        return { config, ok: false as const, errors: { form: [validationError] }, file: null };
      }
    }
    return { config, ...parsed, file: null };
  }

  const formData = await request.formData();
  const values = Object.fromEntries(config.fields
    .filter(field => field.type !== 'file')
    .map(field => [field.name, formData.get(field.name)]));
  const parsed = buildPayloadFromPlainObject(config, values, partial);
  const fileValue = formData.get('file');
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  return { config, ...parsed, file };
}

async function uploadEmployeeDocumentFile(file: File, employeeId: unknown, actingUserId: string) {
  const extension = file.name.split('.').pop() || 'bin';
  const objectName = `employee-documents/${String(employeeId || 'unassigned')}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': file.type || 'application/octet-stream',
    'x-amz-meta-originalname': sanitizeFilename(file.name),
    'x-amz-meta-uploaded-by': actingUserId,
    'x-amz-meta-upload-date': new Date().toISOString(),
  });

  return objectName;
}

type HrColumnValue = {
  column: string;
  value: unknown;
  fieldType?: HrResourceField['type'];
};

function buildColumnValues(config: HrResourceConfig, values: Record<string, unknown>): HrColumnValue[] {
  return config.fields
    .filter(field => field.type !== 'file' && Object.prototype.hasOwnProperty.call(values, field.name))
    .map(field => ({
      column: field.column,
      value: coerceHrFieldValue(field, values[field.name]),
      fieldType: field.type,
    }))
    .filter(entry => entry.value !== undefined);
}

function columnValuePlaceholder(entry: HrColumnValue, parameterIndex: number) {
  const placeholder = `$${parameterIndex}`;
  if (entry.column === 'id' || entry.column === 'employee_id' || entry.column === 'verified_by_id') return `${placeholder}::uuid`;
  if (entry.fieldType === 'json' || entry.fieldType === 'jsonValue') return `${placeholder}::jsonb`;
  return placeholder;
}

async function validatePeopleClientAssignment(
  config: HrResourceConfig,
  values: Record<string, unknown>,
  employeeId?: string,
) {
  if (config.key !== 'people') return;

  let employmentType = values.employmentType;
  let clientId = values.clientId;
  let endDate = values.endDate;
  let contractNoticeDays = values.contractNoticeDays;
  if (employeeId && (employmentType === undefined || clientId === undefined || endDate === undefined || contractNoticeDays === undefined)) {
    const current = await prisma.$queryRawUnsafe<Array<{ employment_type: string; client_id: string | null; end_date: Date | null; contract_notice_days: number }>>(
      `SELECT employment_type, client_id, end_date, contract_notice_days
       FROM "hr_employees"
       WHERE id = $1::uuid
       LIMIT 1`,
      employeeId,
    );
    employmentType ??= current[0]?.employment_type;
    clientId ??= current[0]?.client_id;
    endDate ??= current[0]?.end_date;
    contractNoticeDays ??= current[0]?.contract_notice_days;
  }

  if (employmentType !== 'full_time' && !endDate) {
    throw new Error('An end date is required for non-full-time employees.');
  }
  if (contractNoticeDays !== undefined && contractNoticeDays !== null) {
    const noticeDays = Number(contractNoticeDays);
    if (!Number.isInteger(noticeDays) || noticeDays < 1 || noticeDays > 365) {
      throw new Error('Contract end notice must be between 1 and 365 days.');
    }
  }
  if (employmentType === 'subcontract' && !clientId) {
    throw new Error('Client is required for subcontract employees.');
  }
  if (clientId) {
    const clients = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "hr_clients" WHERE id = $1::uuid LIMIT 1`,
      String(clientId),
    );
    if (!clients[0]) throw new Error('Selected client was not found.');
  }
}

function applyCertificationVerificationMetadata(
  config: HrResourceConfig,
  entries: Array<{ column: string; value: unknown }>,
  actingUserId: string,
) {
  if (config.key !== 'certifications') return;

  const verification = entries.find(entry => entry.column === 'verification_status');
  const withoutServerFields = entries.filter(entry => !['verified_at', 'verified_by_id'].includes(entry.column));
  entries.splice(0, entries.length, ...withoutServerFields);
  if (!verification) return;

  if (verification.value === 'verified') {
    entries.push({ column: 'verified_at', value: new Date() });
    entries.push({ column: 'verified_by_id', value: actingUserId });
  } else {
    entries.push({ column: 'verified_at', value: null });
    entries.push({ column: 'verified_by_id', value: null });
  }
}

export async function createHrCrudRecord({
  moduleKey,
  values,
  file,
  actingUserId,
  view,
}: {
  moduleKey: HrModuleKey;
  values: Record<string, unknown>;
  file?: File | null;
  actingUserId: string;
  view?: string | null;
}) {
  const config = getHrResourceConfig(moduleKey, view);
  await validatePeopleClientAssignment(config, values);
  const now = new Date();
  const entries: HrColumnValue[] = [
    { column: 'id', value: randomUUID() },
    ...buildColumnValues(config, values),
    { column: 'created_at', value: now },
    { column: 'updated_at', value: now },
  ];
  applyCertificationVerificationMetadata(config, entries, actingUserId);

  if (config.key === 'documents' && file) {
    entries.push({
      column: 'file_path',
      value: await uploadEmployeeDocumentFile(file, values.employeeId, actingUserId),
    });
    entries.push({ column: 'uploaded_by_id', value: actingUserId });
  }

  const columns = entries.map(entry => quoteIdent(entry.column));
  // Prisma binds JSON.stringify results as PostgreSQL text. Cast registered
  // JSON fields explicitly so PostgreSQL can assign them to JSONB columns.
  const placeholders = entries.map((entry, index) => columnValuePlaceholder(entry, index + 1));
  const params = entries.map(entry => entry.value);
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `INSERT INTO ${quoteTable(config.table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    ...params,
  );
  if (rows[0]) {
    await linkPeopleRecordToAccountByEmail(config, String(rows[0].id));
    const linkedRecord = await getHrCrudRecord(moduleKey, String(rows[0].id), view);
    if (linkedRecord) return linkedRecord;
  }
  return rowToClientRecord(rows[0], config);
}

export async function updateHrCrudRecord({
  moduleKey,
  id,
  values,
  file,
  actingUserId,
  view,
}: {
  moduleKey: HrModuleKey;
  id: string;
  values: Record<string, unknown>;
  file?: File | null;
  actingUserId: string;
  view?: string | null;
}) {
  const config = getHrResourceConfig(moduleKey, view);
  await validatePeopleClientAssignment(config, values, id);
  const entries = buildColumnValues(config, values);
  applyCertificationVerificationMetadata(config, entries, actingUserId);

  if (config.key === 'documents' && file) {
    entries.push({
      column: 'file_path',
      value: await uploadEmployeeDocumentFile(file, values.employeeId, actingUserId),
    });
    entries.push({ column: 'uploaded_by_id', value: actingUserId });
  }

  if (entries.length === 0) return getHrCrudRecord(moduleKey, id, view);

  const assignments = entries.map((entry, index) => (
    `${quoteIdent(entry.column)} = ${columnValuePlaceholder(entry, index + 2)}`
  ));
  const shouldSyncAccountEmail = config.key === 'people'
    && entries.some(entry => entry.column === 'email');
  const rows = await prisma.$transaction(async (tx) => {
    if (config.key === 'teams') {
      const allocationEntry = entries.find(entry => entry.column === 'headcount_allocation');
      if (allocationEntry) {
        await assertAllocationCanBeSaved(
          tx,
          id,
          allocationEntry.value === null ? null : Number(allocationEntry.value),
        );
      }
    }
    const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${quoteTable(config.table)} SET ${assignments.join(', ')}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid RETURNING *`,
      id,
      ...entries.map(entry => entry.value),
    );
    if (updated[0] && shouldSyncAccountEmail) {
      await tx.$executeRawUnsafe(
        `UPDATE "User" account
         SET "email" = employee."email",
             "updatedAt" = CURRENT_TIMESTAMP
         FROM "hr_employees" employee
         WHERE employee."id" = $1::uuid
           AND account."id" = employee."user_id"`,
        id,
      );
    }
    return updated;
  });
  if (!rows[0]) return null;
  await linkPeopleRecordToAccountByEmail(config, String(rows[0].id));
  return getHrCrudRecord(moduleKey, String(rows[0].id), view);
}

export async function deleteHrCrudRecord(moduleKey: HrModuleKey, id: string, view?: string | null, permanent = false) {
  const config = getHrResourceConfig(moduleKey, view);

  if (config.softDelete && !permanent) {
    const value = config.softDelete.value === 'now' ? new Date() : config.softDelete.value;
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${quoteTable(config.table)} SET ${quoteIdent(config.softDelete.column)} = $2, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid RETURNING *`,
      id,
      value,
    );
    return rows[0] ? rowToClientRecord(rows[0], config) : null;
  }

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `DELETE FROM ${quoteTable(config.table)} WHERE "id" = $1::uuid RETURNING *`,
    id,
  );
  return rows[0] ? rowToClientRecord(rows[0], config) : null;
}
