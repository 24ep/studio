import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

import { getPool } from "@/lib/db";
import { logAudit } from "@/lib/auditLog";
import type {
  AudienceRuleInput,
  SurveyCreateInput,
  SurveyQuestionInput,
  SurveySectionInput,
} from "./survey-contracts";
import { validateRequiredAnswers, validateSurveyLogic } from "./survey-logic";

type JsonRecord = Record<string, unknown>;

export interface SurveyAccessContext {
  userId: string;
  isAdmin: boolean;
  permissions: string[];
}

export interface SurveyRecord {
  id: string;
  title: string;
  internalName: string;
  description: string | null;
  introduction: string | null;
  type: string;
  status: string;
  privacyMode: "identified" | "confidential" | "anonymous";
  ownerUserId: string;
  ownerName: string;
  departmentOwnerId: string | null;
  companyId: string | null;
  estimatedMinutes: number;
  language: string;
  additionalLanguages: string[];
  completionMessage: string | null;
  contactInformation: string | null;
  tags: string[];
  isRequired: boolean;
  allowDraft: boolean;
  allowEditAfterSubmit: boolean;
  anonymousThreshold: number;
  resultsVisibility: string;
  opensAt: string | null;
  closesAt: string | null;
  timezone: string;
  version: number;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AudiencePreviewEmployee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  department: string | null;
  departmentId: string | null;
  businessUnit: string | null;
  location: string | null;
  employmentType: string;
  status: string;
  companyId: string | null;
  clientId: string | null;
  userId: string | null;
  included: boolean;
  exclusionReason: string | null;
  missingContact: boolean;
}

function canManageSurveys(context: SurveyAccessContext) {
  return context.isAdmin || context.permissions.includes("SURVEY_MANAGE") || context.permissions.includes("SURVEY_ADMIN");
}

function canAnalyzeSurveys(context: SurveyAccessContext) {
  return canManageSurveys(context) || context.permissions.includes("SURVEY_ANALYZE");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function asJson(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function mapSurvey(row: JsonRecord): SurveyRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    internalName: String(row.internalName),
    description: row.description ? String(row.description) : null,
    introduction: row.introduction ? String(row.introduction) : null,
    type: String(row.type),
    status: String(row.status),
    privacyMode: row.privacyMode as SurveyRecord["privacyMode"],
    ownerUserId: String(row.ownerUserId),
    ownerName: String(row.ownerName || "Survey owner"),
    departmentOwnerId: row.departmentOwnerId ? String(row.departmentOwnerId) : null,
    companyId: row.companyId ? String(row.companyId) : null,
    estimatedMinutes: Number(row.estimatedMinutes),
    language: String(row.language),
    additionalLanguages: Array.isArray(row.additionalLanguages) ? row.additionalLanguages.map(String) : [],
    completionMessage: row.completionMessage ? String(row.completionMessage) : null,
    contactInformation: row.contactInformation ? String(row.contactInformation) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    isRequired: Boolean(row.isRequired),
    allowDraft: Boolean(row.allowDraft),
    allowEditAfterSubmit: Boolean(row.allowEditAfterSubmit),
    anonymousThreshold: Number(row.anonymousThreshold),
    resultsVisibility: String(row.resultsVisibility),
    opensAt: row.opensAt ? new Date(String(row.opensAt)).toISOString() : null,
    closesAt: row.closesAt ? new Date(String(row.closesAt)).toISOString() : null,
    timezone: String(row.timezone),
    version: Number(row.version),
    publishedAt: row.publishedAt ? new Date(String(row.publishedAt)).toISOString() : null,
    closedAt: row.closedAt ? new Date(String(row.closedAt)).toISOString() : null,
    createdAt: new Date(String(row.createdAt)).toISOString(),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
  };
}

const surveySelect = `
  SELECT
    s.id,
    s.title,
    s.internal_name AS "internalName",
    s.description,
    s.introduction,
    s.type,
    s.status,
    s.privacy_mode AS "privacyMode",
    s.owner_user_id AS "ownerUserId",
    COALESCE(u.name, 'Survey owner') AS "ownerName",
    s.department_owner_id AS "departmentOwnerId",
    s.company_id AS "companyId",
    s.estimated_minutes AS "estimatedMinutes",
    s.language,
    s.additional_languages AS "additionalLanguages",
    s.completion_message AS "completionMessage",
    s.contact_information AS "contactInformation",
    s.tags,
    s.is_required AS "isRequired",
    s.allow_draft AS "allowDraft",
    s.allow_edit_after_submit AS "allowEditAfterSubmit",
    s.anonymous_threshold AS "anonymousThreshold",
    s.results_visibility AS "resultsVisibility",
    s.opens_at AS "opensAt",
    s.closes_at AS "closesAt",
    s.timezone,
    s.version,
    s.published_at AS "publishedAt",
    s.closed_at AS "closedAt",
    s.created_at AS "createdAt",
    s.updated_at AS "updatedAt"
  FROM surveys s
  LEFT JOIN "User" u ON u.id = s.owner_user_id
`;

async function writeSurveyAudit(
  client: PoolClient,
  input: {
    surveyId?: string | null;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: JsonRecord;
  },
) {
  await client.query(
    `INSERT INTO survey_audit_logs
      (id, survey_id, actor_user_id, action, entity_type, entity_id, details, created_at)
     VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6::uuid, $7::jsonb, NOW())`,
    [
      randomUUID(),
      input.surveyId || null,
      input.actorUserId || null,
      input.action,
      input.entityType,
      input.entityId || null,
      JSON.stringify(input.details || {}),
    ],
  );
}

export async function listSurveys(
  context: SurveyAccessContext,
  filters: { status?: string; search?: string; limit?: number; offset?: number } = {},
) {
  const params: unknown[] = [];
  const conditions = ["s.archived_at IS NULL"];
  if (!canManageSurveys(context)) {
    params.push(context.userId);
    conditions.push(`s.owner_user_id = $${params.length}::uuid`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`s.status = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(s.title ILIKE $${params.length} OR s.internal_name ILIKE $${params.length})`);
  }
  const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
  const offset = Math.max(filters.offset || 0, 0);
  params.push(limit, offset);

  const result = await getPool().query(
    `${surveySelect}
     WHERE ${conditions.join(" AND ")}
     ORDER BY s.updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows.map((row) => mapSurvey(row));
}

export async function getSurveyDashboard(context: SurveyAccessContext) {
  const employee = await getPool().query(
    `SELECT id FROM hr_employees WHERE user_id = $1::uuid LIMIT 1`,
    [context.userId],
  );
  const employeeId = employee.rows[0]?.id as string | undefined;

  const assignedPromise = employeeId
    ? getPool().query(
      `${surveySelect}
       JOIN survey_invitations i ON i.survey_id = s.id
       LEFT JOIN survey_participation p ON p.survey_id = s.id AND p.employee_id = i.employee_id
       WHERE i.employee_id = $1::uuid
         AND s.status IN ('active', 'scheduled')
         AND (s.opens_at IS NULL OR s.opens_at <= NOW())
         AND (s.closes_at IS NULL OR s.closes_at >= NOW())
       ORDER BY
         CASE COALESCE(p.status, 'not_started')
           WHEN 'in_progress' THEN 1
           WHEN 'not_started' THEN 2
           ELSE 3
         END,
         s.is_required DESC,
         s.closes_at ASC NULLS LAST`,
      [employeeId],
    )
    : Promise.resolve({ rows: [] } as { rows: JsonRecord[] });

  const ownershipCondition = canManageSurveys(context) ? "TRUE" : "s.owner_user_id = $1::uuid";
  const ownerParams = canManageSurveys(context) ? [] : [context.userId];
  const [assigned, metrics, recent] = await Promise.all([
    assignedPromise,
    getPool().query(
      `SELECT
         COUNT(*) FILTER (WHERE s.status = 'draft')::int AS drafts,
         COUNT(*) FILTER (WHERE s.status = 'scheduled')::int AS scheduled,
         COUNT(*) FILTER (WHERE s.status = 'active')::int AS active,
         COUNT(*) FILTER (WHERE s.status = 'closed')::int AS closed,
         COALESCE(SUM(part.total), 0)::int AS invitations,
         COALESCE(SUM(part.completed), 0)::int AS completed
       FROM surveys s
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
         FROM survey_participation p
         WHERE p.survey_id = s.id
       ) part ON TRUE
       WHERE s.archived_at IS NULL AND ${ownershipCondition}`,
      ownerParams,
    ),
    getPool().query(
      `SELECT a.id, a.survey_id AS "surveyId", a.action, a.entity_type AS "entityType",
              a.details, a.created_at AS "createdAt", COALESCE(u.name, 'System') AS actor
       FROM survey_audit_logs a
       LEFT JOIN "User" u ON u.id = a.actor_user_id
       JOIN surveys s ON s.id = a.survey_id
       WHERE ${ownershipCondition}
       ORDER BY a.created_at DESC
       LIMIT 8`,
      ownerParams,
    ),
  ]);

  const metricRow = metrics.rows[0] || {};
  const invitations = Number(metricRow.invitations || 0);
  const completed = Number(metricRow.completed || 0);
  return {
    assigned: assigned.rows.map((row) => mapSurvey(row)),
    metrics: {
      drafts: Number(metricRow.drafts || 0),
      scheduled: Number(metricRow.scheduled || 0),
      active: Number(metricRow.active || 0),
      closed: Number(metricRow.closed || 0),
      invitations,
      completed,
      responseRate: invitations === 0 ? null : Math.round((completed / invitations) * 100),
    },
    recentActivity: recent.rows,
    capabilities: {
      canManage: canManageSurveys(context),
      canAnalyze: canAnalyzeSurveys(context),
      canExport: context.isAdmin || context.permissions.includes("SURVEY_EXPORT"),
      canViewConfidential: context.isAdmin || context.permissions.includes("SURVEY_RESPONSE_CONFIDENTIAL"),
    },
  };
}

export async function createSurvey(context: SurveyAccessContext, input: SurveyCreateInput) {
  const client = await getPool().connect();
  const surveyId = randomUUID();
  const sectionId = randomUUID();
  try {
    await client.query("BEGIN");
    let templateDefinition: JsonRecord | null = null;
    if (input.templateId) {
      const template = await client.query(
        `SELECT definition FROM survey_templates WHERE id = $1::uuid AND is_archived = false`,
        [input.templateId],
      );
      if (!template.rows[0]) throw new Error("Survey template not found.");
      templateDefinition = asJson(template.rows[0].definition);
    }

    const result = await client.query(
      `INSERT INTO surveys (
        id, title, internal_name, description, introduction, type, status, privacy_mode,
        owner_user_id, department_owner_id, company_id, estimated_minutes, language,
        additional_languages, completion_message, contact_information, tags, is_required,
        allow_draft, allow_edit_after_submit, anonymous_threshold, results_visibility,
        opens_at, closes_at, timezone, version, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 1, NOW(), NOW()
      ) RETURNING id`,
      [
        surveyId,
        input.title,
        input.internalName || input.title,
        input.description || null,
        input.introduction || null,
        input.type,
        input.privacyMode,
        context.userId,
        input.departmentOwnerId || null,
        input.companyId || null,
        input.estimatedMinutes,
        input.language,
        JSON.stringify(input.additionalLanguages),
        input.completionMessage || "Thank you. Your response has been recorded.",
        input.contactInformation || null,
        input.tags,
        input.isRequired,
        input.allowDraft,
        input.allowEditAfterSubmit,
        input.anonymousThreshold,
        input.resultsVisibility,
        input.opensAt ? new Date(input.opensAt) : null,
        input.closesAt ? new Date(input.closesAt) : null,
        input.timezone,
      ],
    );

    const templateSections = Array.isArray(templateDefinition?.sections)
      ? templateDefinition.sections as JsonRecord[]
      : [];
    if (templateSections.length === 0) {
      await client.query(
        `INSERT INTO survey_sections (id, survey_id, title, description, sort_order, conditions, randomize_questions, created_at, updated_at)
         VALUES ($1, $2, 'Your feedback', 'A focused set of questions for this survey.', 0, '[]', false, NOW(), NOW())`,
        [sectionId, surveyId],
      );
    } else {
      for (const [sectionIndex, section] of templateSections.entries()) {
        const templateSectionId = randomUUID();
        await client.query(
          `INSERT INTO survey_sections (id, survey_id, title, description, sort_order, conditions, randomize_questions, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, '[]', false, NOW(), NOW())`,
          [templateSectionId, surveyId, String(section.title || `Section ${sectionIndex + 1}`), section.description || null, sectionIndex],
        );
        const questions = Array.isArray(section.questions) ? section.questions as JsonRecord[] : [];
        for (const [questionIndex, question] of questions.entries()) {
          await client.query(
            `INSERT INTO survey_questions
              (id, survey_id, section_id, type, text, description, help_text, is_required, sort_order, config, logic, dimension, tags, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, '[]', $11, $12, NOW(), NOW())`,
            [
              randomUUID(),
              surveyId,
              templateSectionId,
              String(question.type || "rating"),
              String(question.text || "Question"),
              question.description || null,
              question.helpText || null,
              Boolean(question.isRequired),
              questionIndex,
              JSON.stringify(asJson(question.config)),
              question.dimension || null,
              Array.isArray(question.tags) ? question.tags : [],
            ],
          );
        }
      }
    }

    await writeSurveyAudit(client, {
      surveyId,
      actorUserId: context.userId,
      action: "created",
      entityType: "survey",
      entityId: surveyId,
      details: { privacyMode: input.privacyMode, type: input.type, templateId: input.templateId || null },
    });
    await client.query("COMMIT");
    await logAudit("AUDIT", `Created survey ${input.title}`, "Survey", context.userId, { surveyId });
    return getSurveyById(context, String(result.rows[0].id));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getSurveyById(context: SurveyAccessContext, surveyId: string) {
  const result = await getPool().query(`${surveySelect} WHERE s.id = $1::uuid`, [surveyId]);
  if (!result.rows[0]) return null;
  const survey = mapSurvey(result.rows[0]);
  if (!canManageSurveys(context) && survey.ownerUserId !== context.userId) {
    return null;
  }
  const [sections, questions, rules, participation] = await Promise.all([
    getPool().query(
      `SELECT id, survey_id AS "surveyId", title, description, sort_order AS "sortOrder",
              conditions, randomize_questions AS "randomizeQuestions"
       FROM survey_sections WHERE survey_id = $1::uuid ORDER BY sort_order, created_at`,
      [surveyId],
    ),
    getPool().query(
      `SELECT id, survey_id AS "surveyId", section_id AS "sectionId", type, text, description,
              help_text AS "helpText", is_required AS "isRequired", sort_order AS "sortOrder",
              config, logic, dimension, tags
       FROM survey_questions
       WHERE survey_id = $1::uuid AND archived_at IS NULL
       ORDER BY section_id, sort_order, created_at`,
      [surveyId],
    ),
    getPool().query(
      `SELECT id, mode, attribute, operator, value, sort_order AS "sortOrder"
       FROM survey_audience_rules WHERE survey_id = $1::uuid ORDER BY sort_order`,
      [surveyId],
    ),
    getPool().query(
      `SELECT COUNT(*)::int AS invitations,
              COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
              COUNT(*) FILTER (WHERE status = 'in_progress')::int AS "inProgress",
              COUNT(*) FILTER (WHERE status = 'not_started')::int AS "notStarted"
       FROM survey_participation WHERE survey_id = $1::uuid`,
      [surveyId],
    ),
  ]);
  return {
    ...survey,
    sections: sections.rows,
    questions: questions.rows,
    audienceRules: rules.rows,
    participation: participation.rows[0],
  };
}

export async function updateSurvey(
  context: SurveyAccessContext,
  surveyId: string,
  input: Partial<SurveyCreateInput> & {
    status?: string;
    expectedVersion: number;
    sections?: SurveySectionInput[];
    questions?: SurveyQuestionInput[];
  },
) {
  const existing = await getSurveyById(context, surveyId);
  if (!existing) throw new Error("Survey not found or you do not have access.");
  if (!canManageSurveys(context) && existing.ownerUserId !== context.userId) {
    throw new Error("You do not have permission to update this survey.");
  }
  if (["active", "closed", "archived"].includes(existing.status) && (input.sections || input.questions)) {
    throw new Error("Published survey content is immutable. Create a new version before editing questions.");
  }
  if (input.questions) {
    const issues = validateSurveyLogic(input.questions);
    if (issues.length > 0) {
      const error = new Error("Survey logic validation failed.");
      Object.assign(error, { issues });
      throw error;
    }
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE surveys SET
        title = COALESCE($3, title),
        internal_name = COALESCE($4, internal_name),
        description = CASE WHEN $5::boolean THEN $6 ELSE description END,
        introduction = CASE WHEN $7::boolean THEN $8 ELSE introduction END,
        type = COALESCE($9, type),
        status = COALESCE($10, status),
        privacy_mode = COALESCE($11, privacy_mode),
        department_owner_id = CASE WHEN $12::boolean THEN $13::uuid ELSE department_owner_id END,
        company_id = CASE WHEN $14::boolean THEN $15::uuid ELSE company_id END,
        estimated_minutes = COALESCE($16, estimated_minutes),
        language = COALESCE($17, language),
        additional_languages = COALESCE($18::jsonb, additional_languages),
        completion_message = CASE WHEN $19::boolean THEN $20 ELSE completion_message END,
        contact_information = CASE WHEN $21::boolean THEN $22 ELSE contact_information END,
        tags = COALESCE($23, tags),
        is_required = COALESCE($24, is_required),
        allow_draft = COALESCE($25, allow_draft),
        allow_edit_after_submit = COALESCE($26, allow_edit_after_submit),
        anonymous_threshold = COALESCE($27, anonymous_threshold),
        results_visibility = COALESCE($28, results_visibility),
        opens_at = CASE WHEN $29::boolean THEN $30::timestamptz ELSE opens_at END,
        closes_at = CASE WHEN $31::boolean THEN $32::timestamptz ELSE closes_at END,
        timezone = COALESCE($33, timezone),
        version = version + 1,
        updated_at = NOW()
       WHERE id = $1::uuid AND version = $2
       RETURNING version`,
      [
        surveyId,
        input.expectedVersion,
        input.title ?? null,
        input.internalName ?? null,
        "description" in input,
        input.description ?? null,
        "introduction" in input,
        input.introduction ?? null,
        input.type ?? null,
        input.status ?? null,
        input.privacyMode ?? null,
        "departmentOwnerId" in input,
        input.departmentOwnerId ?? null,
        "companyId" in input,
        input.companyId ?? null,
        input.estimatedMinutes ?? null,
        input.language ?? null,
        input.additionalLanguages ? JSON.stringify(input.additionalLanguages) : null,
        "completionMessage" in input,
        input.completionMessage ?? null,
        "contactInformation" in input,
        input.contactInformation ?? null,
        input.tags ?? null,
        input.isRequired ?? null,
        input.allowDraft ?? null,
        input.allowEditAfterSubmit ?? null,
        input.anonymousThreshold ?? null,
        input.resultsVisibility ?? null,
        "opensAt" in input,
        input.opensAt || null,
        "closesAt" in input,
        input.closesAt || null,
        input.timezone ?? null,
      ],
    );
    if (!updated.rows[0]) {
      const conflict = new Error("This survey changed in another session. Refresh before saving again.");
      Object.assign(conflict, { code: "CONCURRENT_UPDATE" });
      throw conflict;
    }

    if (input.sections) {
      const keepIds: string[] = [];
      for (const section of input.sections) {
        const id = section.id || randomUUID();
        keepIds.push(id);
        await client.query(
          `INSERT INTO survey_sections
            (id, survey_id, title, description, sort_order, conditions, randomize_questions, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title, description = EXCLUDED.description,
             sort_order = EXCLUDED.sort_order, conditions = EXCLUDED.conditions,
             randomize_questions = EXCLUDED.randomize_questions, updated_at = NOW()
           WHERE survey_sections.survey_id = EXCLUDED.survey_id`,
          [id, surveyId, section.title, section.description || null, section.sortOrder, JSON.stringify(section.conditions), section.randomizeQuestions],
        );
      }
      if (keepIds.length > 0) {
        await client.query(
          `DELETE FROM survey_sections WHERE survey_id = $1::uuid AND NOT (id = ANY($2::uuid[]))`,
          [surveyId, keepIds],
        );
      }
    }

    if (input.questions) {
      const keepIds: string[] = [];
      for (const question of input.questions) {
        const id = question.id || randomUUID();
        keepIds.push(id);
        await client.query(
          `INSERT INTO survey_questions
            (id, survey_id, section_id, type, text, description, help_text, is_required,
             sort_order, config, logic, dimension, tags, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             section_id = EXCLUDED.section_id, type = EXCLUDED.type, text = EXCLUDED.text,
             description = EXCLUDED.description, help_text = EXCLUDED.help_text,
             is_required = EXCLUDED.is_required, sort_order = EXCLUDED.sort_order,
             config = EXCLUDED.config, logic = EXCLUDED.logic, dimension = EXCLUDED.dimension,
             tags = EXCLUDED.tags, updated_at = NOW()
           WHERE survey_questions.survey_id = EXCLUDED.survey_id`,
          [
            id,
            surveyId,
            question.sectionId,
            question.type,
            question.text,
            question.description || null,
            question.helpText || null,
            question.isRequired,
            question.sortOrder,
            JSON.stringify(question.config),
            JSON.stringify(question.logic),
            question.dimension || null,
            question.tags,
          ],
        );
      }
      if (keepIds.length > 0) {
        await client.query(
          `UPDATE survey_questions SET archived_at = NOW(), updated_at = NOW()
           WHERE survey_id = $1::uuid AND NOT (id = ANY($2::uuid[])) AND archived_at IS NULL`,
          [surveyId, keepIds],
        );
      }
    }

    await writeSurveyAudit(client, {
      surveyId,
      actorUserId: context.userId,
      action: "updated",
      entityType: "survey",
      entityId: surveyId,
      details: { version: Number(updated.rows[0].version), changedFields: Object.keys(input) },
    });
    await client.query("COMMIT");
    return getSurveyById(context, surveyId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function normalizeRuleValues(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function employeeValue(employee: AudiencePreviewEmployee & { hireDate?: string | null }, attribute: AudienceRuleInput["attribute"]) {
  switch (attribute) {
    case "employee": return employee.id;
    case "company": return employee.companyId;
    case "business_unit": return employee.businessUnit;
    case "department": return employee.departmentId;
    case "manager": return (employee as AudiencePreviewEmployee & { managerId?: string | null }).managerId;
    case "position": return (employee as AudiencePreviewEmployee & { positionId?: string | null }).positionId;
    case "location": return employee.location;
    case "employment_type": return employee.employmentType;
    case "status": return employee.status;
    case "join_date": return employee.hireDate;
    case "tenure_months":
      return employee.hireDate
        ? Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / 2_629_800_000)
        : null;
    case "client": return employee.clientId;
  }
}

function matchesAudienceRule(employee: AudiencePreviewEmployee & { hireDate?: string | null }, rule: AudienceRuleInput) {
  const actual = employeeValue(employee, rule.attribute);
  const values = normalizeRuleValues(rule.value);
  switch (rule.operator) {
    case "equals": return actual === values[0];
    case "not_equals": return actual !== values[0];
    case "in": return values.includes(actual);
    case "not_in": return !values.includes(actual);
    case "contains": return String(actual || "").toLowerCase().includes(String(values[0] || "").toLowerCase());
    case "before": return Boolean(actual) && new Date(String(actual)).getTime() < new Date(String(values[0])).getTime();
    case "after": return Boolean(actual) && new Date(String(actual)).getTime() > new Date(String(values[0])).getTime();
    case "between":
      return Boolean(actual)
        && Number(actual) >= Number(values[0])
        && Number(actual) <= Number(values[1]);
  }
}

export async function previewSurveyAudience(
  context: SurveyAccessContext,
  surveyId: string,
  rules: AudienceRuleInput[],
  persistRules = false,
) {
  const survey = await getSurveyById(context, surveyId);
  if (!survey) throw new Error("Survey not found or you do not have access.");
  const result = await getPool().query(
    `SELECT
       e.id,
       e.employee_number AS "employeeNumber",
       CONCAT_WS(' ', e.first_name, e.last_name) AS name,
       e.email,
       e.department_id AS "departmentId",
       d.name AS department,
       e.business_unit AS "businessUnit",
       e.location,
       e.employment_type AS "employmentType",
       e.status,
       e.company_id AS "companyId",
       e.client_id AS "clientId",
       e.user_id AS "userId",
       e.manager_id AS "managerId",
       e.position_id AS "positionId",
       e.hire_date AS "hireDate"
     FROM hr_employees e
     LEFT JOIN hr_departments d ON d.id = e.department_id
     WHERE ($1::uuid IS NULL OR e.company_id = $1::uuid)
     ORDER BY d.name NULLS LAST, e.first_name, e.last_name`,
    [survey.companyId],
  );

  const includeRules = rules.filter((rule) => rule.mode === "include");
  const excludeRules = rules.filter((rule) => rule.mode === "exclude");
  const employees = result.rows.map((row): AudiencePreviewEmployee => {
    const active = row.status === "active";
    const includedByRules = includeRules.length === 0 || includeRules.some((rule) => matchesAudienceRule(row, rule));
    const exclusionRule = excludeRules.find((rule) => matchesAudienceRule(row, rule));
    const included = active && includedByRules && !exclusionRule;
    return {
      id: row.id,
      employeeNumber: row.employeeNumber,
      name: row.name,
      email: row.email,
      department: row.department,
      departmentId: row.departmentId,
      businessUnit: row.businessUnit,
      location: row.location,
      employmentType: row.employmentType,
      status: row.status,
      companyId: row.companyId,
      clientId: row.clientId,
      userId: row.userId,
      included,
      exclusionReason: !active
        ? "Inactive employee"
        : !includedByRules
          ? "Did not match an inclusion rule"
          : exclusionRule
            ? `Excluded by ${exclusionRule.attribute}`
            : null,
      missingContact: !row.email && !row.userId,
    };
  });

  if (persistRules) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM survey_audience_rules WHERE survey_id = $1::uuid`, [surveyId]);
      for (const [index, rule] of rules.entries()) {
        await client.query(
          `INSERT INTO survey_audience_rules
            (id, survey_id, mode, attribute, operator, value, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW(), NOW())`,
          [rule.id || randomUUID(), surveyId, rule.mode, rule.attribute, rule.operator, JSON.stringify(rule.value), index],
        );
      }
      await writeSurveyAudit(client, {
        surveyId,
        actorUserId: context.userId,
        action: "audience_rules_updated",
        entityType: "survey",
        entityId: surveyId,
        details: { ruleCount: rules.length },
      });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const included = employees.filter((employee) => employee.included);
  const byDepartment = new Map<string, number>();
  for (const employee of included) {
    const department = employee.department || "Unassigned";
    byDepartment.set(department, (byDepartment.get(department) || 0) + 1);
  }
  return {
    totalEmployees: employees.length,
    included: included.length,
    excluded: employees.length - included.length,
    inactive: employees.filter((employee) => employee.status !== "active").length,
    missingContact: included.filter((employee) => employee.missingContact).length,
    duplicates: 0,
    conflicts: 0,
    employees,
    departmentDistribution: [...byDepartment.entries()]
      .map(([department, count]) => ({ department, count }))
      .sort((left, right) => right.count - left.count),
  };
}

export async function publishSurvey(
  context: SurveyAccessContext,
  surveyId: string,
  input: {
    confirmationPopulation: number;
    channels: string[];
    publishAt?: string | null;
    closesAt?: string | null;
    idempotencyKey: string;
  },
) {
  const survey = await getSurveyById(context, surveyId);
  if (!survey) throw new Error("Survey not found or you do not have access.");
  if (!["draft", "approved", "scheduled", "paused"].includes(survey.status)) {
    throw new Error(`A ${survey.status} survey cannot be published.`);
  }
  const logicIssues = validateSurveyLogic(survey.questions as SurveyQuestionInput[]);
  if (logicIssues.length > 0) {
    const error = new Error("Fix survey logic before publishing.");
    Object.assign(error, { issues: logicIssues });
    throw error;
  }
  const preview = await previewSurveyAudience(context, surveyId, survey.audienceRules as AudienceRuleInput[]);
  if (preview.included !== input.confirmationPopulation) {
    throw new Error(`Audience changed from ${input.confirmationPopulation} to ${preview.included}. Review the population before publishing.`);
  }
  if (preview.included === 0) throw new Error("Add at least one eligible employee before publishing.");

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const duplicate = await client.query(
      `SELECT id FROM survey_distributions
       WHERE survey_id = $1::uuid AND payload->>'idempotencyKey' = $2 LIMIT 1`,
      [surveyId, input.idempotencyKey],
    );
    if (duplicate.rows[0]) {
      await client.query("ROLLBACK");
      return { published: true, idempotent: true, population: preview.included };
    }

    await client.query(`DELETE FROM survey_audience_snapshots WHERE survey_id = $1::uuid`, [surveyId]);
    const expiresAt = input.closesAt || survey.closesAt || new Date(Date.now() + 30 * 86_400_000).toISOString();
    for (const employee of preview.employees) {
      await client.query(
        `INSERT INTO survey_audience_snapshots
          (id, survey_id, employee_id, included, reason, employee_snapshot, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
        [
          randomUUID(),
          surveyId,
          employee.id,
          employee.included,
          employee.exclusionReason,
          JSON.stringify({
            employeeNumber: employee.employeeNumber,
            departmentId: employee.departmentId,
            department: employee.department,
            businessUnit: employee.businessUnit,
            location: employee.location,
            employmentType: employee.employmentType,
            companyId: employee.companyId,
          }),
        ],
      );
      if (!employee.included) continue;
      const invitationToken = randomBytes(32).toString("base64url");
      await client.query(
        `INSERT INTO survey_invitations
          (id, survey_id, employee_id, user_id, token_hash, status, sent_at, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'sent', NOW(), $6, NOW(), NOW())
         ON CONFLICT (survey_id, employee_id) DO UPDATE SET
           user_id = EXCLUDED.user_id, status = CASE
             WHEN survey_invitations.status = 'completed' THEN 'completed' ELSE 'sent' END,
           expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
        [randomUUID(), surveyId, employee.id, employee.userId, hashToken(invitationToken), expiresAt],
      );
      await client.query(
        `INSERT INTO survey_participation
          (id, survey_id, employee_id, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, 'not_started', 1, NOW(), NOW())
         ON CONFLICT (survey_id, employee_id) DO NOTHING`,
        [randomUUID(), surveyId, employee.id],
      );
      if (employee.userId && input.channels.some((channel) => ["in_app", "employee_portal", "ess"].includes(channel))) {
        await client.query(
          `INSERT INTO "Notification" (id, "userId", type, title, message, data, "isRead", "createdAt", "updatedAt")
           VALUES ($1, $2, 'survey_invitation', $3, $4, $5::jsonb, false, NOW(), NOW())`,
          [
            randomUUID(),
            employee.userId,
            survey.title,
            `${survey.isRequired ? "Required survey" : "Survey"} · ${survey.estimatedMinutes} min`,
            JSON.stringify({ href: `/survey/${surveyId}/respond`, surveyId, dueDate: input.closesAt || survey.closesAt, privacyMode: survey.privacyMode }),
          ],
        );
      }
    }

    for (const channel of input.channels) {
      await client.query(
        `INSERT INTO survey_distributions
          (id, survey_id, channel, status, scheduled_at, sent_at, payload, sent_count, failed_count, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 0, $9, NOW(), NOW())`,
        [
          randomUUID(),
          surveyId,
          channel,
          input.publishAt ? "scheduled" : "sent",
          input.publishAt || null,
          input.publishAt ? null : new Date(),
          JSON.stringify({ idempotencyKey: input.idempotencyKey, source: "survey", audienceSnapshot: true }),
          preview.included,
          context.userId,
        ],
      );
    }
    const status = input.publishAt && new Date(input.publishAt).getTime() > Date.now() ? "scheduled" : "active";
    await client.query(
      `UPDATE surveys SET status = $2, opens_at = COALESCE($3, opens_at, NOW()),
        closes_at = COALESCE($4, closes_at), published_at = COALESCE(published_at, NOW()),
        version = version + 1, updated_at = NOW() WHERE id = $1::uuid`,
      [surveyId, status, input.publishAt || null, input.closesAt || null],
    );
    await client.query(
      `INSERT INTO survey_versions (id, survey_id, version, status, snapshot, created_by_id, published_at, created_at)
       SELECT $1, s.id, s.version, $2, jsonb_build_object(
         'survey', to_jsonb(s),
         'sections', COALESCE((SELECT jsonb_agg(sec ORDER BY sec.sort_order) FROM survey_sections sec WHERE sec.survey_id = s.id), '[]'::jsonb),
         'questions', COALESCE((SELECT jsonb_agg(q ORDER BY q.sort_order) FROM survey_questions q WHERE q.survey_id = s.id AND q.archived_at IS NULL), '[]'::jsonb)
       ), $3, NOW(), NOW()
       FROM surveys s WHERE s.id = $4::uuid`,
      [randomUUID(), status, context.userId, surveyId],
    );
    await writeSurveyAudit(client, {
      surveyId,
      actorUserId: context.userId,
      action: status === "scheduled" ? "scheduled" : "published",
      entityType: "survey",
      entityId: surveyId,
      details: { population: preview.included, channels: input.channels, privacyMode: survey.privacyMode },
    });
    await client.query("COMMIT");
    return { published: true, status, population: preview.included, channels: input.channels };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listAssignedSurveys(userId: string) {
  const result = await getPool().query(
    `${surveySelect.replace('FROM surveys s', ', p.status AS "participationStatus", p.started_at AS "startedAt", p.completed_at AS "completedAt" FROM surveys s')}
     JOIN survey_invitations i ON i.survey_id = s.id
     JOIN hr_employees e ON e.id = i.employee_id AND e.user_id = $1::uuid
     LEFT JOIN survey_participation p ON p.survey_id = s.id AND p.employee_id = e.id
     WHERE i.status <> 'excluded'
     ORDER BY s.is_required DESC, s.closes_at ASC NULLS LAST`,
    [userId],
  );
  return result.rows.map((row) => ({
    ...mapSurvey(row),
    participationStatus: row.participationStatus || "not_started",
    startedAt: row.startedAt || null,
    completedAt: row.completedAt || null,
  }));
}

export async function getRespondentSurvey(userId: string, surveyId: string) {
  const result = await getPool().query(
    `${surveySelect}
     JOIN survey_invitations i ON i.survey_id = s.id
     JOIN hr_employees e ON e.id = i.employee_id AND e.user_id = $2::uuid
     WHERE s.id = $1::uuid
       AND i.status <> 'excluded'
       AND (s.opens_at IS NULL OR s.opens_at <= NOW())
       AND (s.closes_at IS NULL OR s.closes_at >= NOW())
       AND s.status IN ('active', 'paused')`,
    [surveyId, userId],
  );
  if (!result.rows[0]) return null;
  const [sections, questions, participation] = await Promise.all([
    getPool().query(
      `SELECT id, title, description, sort_order AS "sortOrder"
       FROM survey_sections WHERE survey_id = $1::uuid ORDER BY sort_order`,
      [surveyId],
    ),
    getPool().query(
      `SELECT id, section_id AS "sectionId", type, text, description, help_text AS "helpText",
              is_required AS "isRequired", sort_order AS "sortOrder", config, logic, dimension
       FROM survey_questions
       WHERE survey_id = $1::uuid AND archived_at IS NULL
       ORDER BY section_id, sort_order`,
      [surveyId],
    ),
    getPool().query(
      `SELECT p.status, p.started_at AS "startedAt", p.last_saved_at AS "lastSavedAt",
              p.completed_at AS "completedAt"
       FROM survey_participation p
       JOIN hr_employees e ON e.id = p.employee_id
       WHERE p.survey_id = $1::uuid AND e.user_id = $2::uuid`,
      [surveyId, userId],
    ),
  ]);
  const survey = mapSurvey(result.rows[0]);
  return {
    ...survey,
    sections: sections.rows,
    questions: questions.rows,
    participation: participation.rows[0] || { status: "not_started" },
    privacyNotice: survey.privacyMode === "anonymous"
      ? `Your answer content is stored separately from participation. Survey owners and standard analysts cannot see who submitted a response. Results for groups smaller than ${survey.anonymousThreshold} are suppressed.`
      : survey.privacyMode === "confidential"
        ? "Your identity is stored with the response but is visible only to roles with explicit confidential-response permission."
        : "Your response is identified and may be reviewed by authorized survey roles.",
  };
}

export async function startResponse(userId: string, surveyId: string) {
  const survey = await getRespondentSurvey(userId, surveyId);
  if (!survey) throw new Error("This survey is not available to you.");
  if (survey.status === "paused") throw new Error("This survey is temporarily paused.");
  if (survey.participation.status === "completed" && !survey.allowEditAfterSubmit) {
    throw new Error("You have already completed this survey.");
  }
  const client = await getPool().connect();
  const responseToken = randomBytes(32).toString("base64url");
  const bindingToken = randomBytes(32).toString("base64url");
  try {
    await client.query("BEGIN");
    const employee = await client.query(
      `SELECT e.id
       FROM hr_employees e
       JOIN survey_invitations i ON i.employee_id = e.id AND i.survey_id = $1::uuid
       WHERE e.user_id = $2::uuid FOR UPDATE`,
      [surveyId, userId],
    );
    if (!employee.rows[0]) throw new Error("Survey invitation not found.");
    const employeeId = String(employee.rows[0].id);
    const responseId = randomUUID();
    const referenceCode = survey.privacyMode === "anonymous"
      ? null
      : `SR-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    await client.query(
      `INSERT INTO survey_responses
        (id, survey_id, privacy_mode, respondent_employee_id, response_binding_hash,
         access_token_hash, status, started_at, reference_code, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW(), $7, 1, NOW(), NOW())`,
      [
        responseId,
        surveyId,
        survey.privacyMode,
        survey.privacyMode === "anonymous" ? null : employeeId,
        hashToken(bindingToken),
        hashToken(responseToken),
        referenceCode,
      ],
    );
    await client.query(
      `UPDATE survey_invitations SET status = 'in_progress', response_binding_hash = $3,
         updated_at = NOW() WHERE survey_id = $1::uuid AND employee_id = $2::uuid`,
      [surveyId, employeeId, hashToken(bindingToken)],
    );
    await client.query(
      `UPDATE survey_participation SET status = 'in_progress',
         started_at = COALESCE(started_at, NOW()), updated_at = NOW(), version = version + 1
       WHERE survey_id = $1::uuid AND employee_id = $2::uuid`,
      [surveyId, employeeId],
    );
    await client.query("COMMIT");
    return { responseToken, version: 1, answers: {}, startedAt: new Date().toISOString() };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function saveResponse(input: {
  responseToken: string;
  expectedVersion?: number;
  answers: Record<string, unknown>;
  submit: boolean;
}) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const responseResult = await client.query(
      `SELECT r.id, r.survey_id AS "surveyId", r.status, r.version,
              r.response_binding_hash AS "responseBindingHash", r.started_at AS "startedAt",
              s.status AS "surveyStatus", s.closes_at AS "closesAt",
              s.allow_edit_after_submit AS "allowEditAfterSubmit", s.privacy_mode AS "privacyMode",
              s.completion_message AS "completionMessage"
       FROM survey_responses r
       JOIN surveys s ON s.id = r.survey_id
       WHERE r.access_token_hash = $1
       FOR UPDATE`,
      [hashToken(input.responseToken)],
    );
    const response = responseResult.rows[0];
    if (!response) throw new Error("Response session not found or expired.");
    if (response.surveyStatus !== "active") throw new Error("This survey is not accepting responses.");
    if (response.closesAt && new Date(response.closesAt).getTime() < Date.now()) {
      throw new Error("This survey has closed.");
    }
    if (response.status === "submitted" && !response.allowEditAfterSubmit) {
      throw new Error("This response has already been submitted.");
    }
    if (input.expectedVersion && Number(response.version) !== input.expectedVersion) {
      const conflict = new Error("Your response changed in another session. Reload before saving.");
      Object.assign(conflict, { code: "CONCURRENT_UPDATE" });
      throw conflict;
    }

    const questions = await client.query(
      `SELECT id, section_id AS "sectionId", type, text, is_required AS "isRequired",
              sort_order AS "sortOrder", config, logic, tags
       FROM survey_questions
       WHERE survey_id = $1::uuid AND archived_at IS NULL`,
      [response.surveyId],
    );
    const allowedIds = new Set(questions.rows.map((question) => String(question.id)));
    for (const questionId of Object.keys(input.answers)) {
      if (!allowedIds.has(questionId)) throw new Error("Response contains an unknown question.");
    }
    if (input.submit) {
      const issues = validateRequiredAnswers(questions.rows, input.answers);
      if (issues.length > 0) {
        const error = new Error("Complete the required questions before submitting.");
        Object.assign(error, { issues });
        throw error;
      }
    }

    for (const [questionId, value] of Object.entries(input.answers)) {
      await client.query(
        `INSERT INTO survey_response_answers (id, response_id, question_id, value, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
         ON CONFLICT (response_id, question_id) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
        [randomUUID(), response.id, questionId, JSON.stringify(value)],
      );
    }
    const nextVersion = Number(response.version) + 1;
    await client.query(
      `UPDATE survey_responses SET status = $2,
         submitted_at = CASE WHEN $3 THEN NOW() ELSE submitted_at END,
         duration_seconds = CASE WHEN $3 THEN EXTRACT(EPOCH FROM (NOW() - started_at))::int ELSE duration_seconds END,
         version = $4, updated_at = NOW()
       WHERE id = $1::uuid`,
      [response.id, input.submit ? "submitted" : "draft", input.submit, nextVersion],
    );
    const invitation = await client.query(
      `SELECT survey_id AS "surveyId", employee_id AS "employeeId"
       FROM survey_invitations WHERE response_binding_hash = $1`,
      [response.responseBindingHash],
    );
    if (invitation.rows[0]) {
      await client.query(
        `UPDATE survey_participation SET status = $3,
           last_saved_at = NOW(), completed_at = CASE WHEN $4 THEN NOW() ELSE completed_at END,
           version = version + 1, updated_at = NOW()
         WHERE survey_id = $1::uuid AND employee_id = $2::uuid`,
        [invitation.rows[0].surveyId, invitation.rows[0].employeeId, input.submit ? "completed" : "in_progress", input.submit],
      );
      if (input.submit) {
        await client.query(
          `UPDATE survey_invitations SET status = 'completed', completed_at = NOW(),
             updated_at = NOW() WHERE response_binding_hash = $1`,
          [response.responseBindingHash],
        );
      }
    }
    await writeSurveyAudit(client, {
      surveyId: response.surveyId,
      actorUserId: null,
      action: input.submit ? "response_submitted" : "response_saved",
      entityType: "survey_response",
      entityId: response.id,
      details: { privacyMode: response.privacyMode, answerCount: Object.keys(input.answers).length },
    });
    await client.query("COMMIT");
    return {
      saved: true,
      submitted: input.submit,
      version: nextVersion,
      savedAt: new Date().toISOString(),
      completionMessage: input.submit ? response.completionMessage : null,
      referenceCode: input.submit && response.privacyMode !== "anonymous"
        ? (await getPool().query(`SELECT reference_code FROM survey_responses WHERE id = $1::uuid`, [response.id])).rows[0]?.reference_code
        : null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getSurveyAnalytics(context: SurveyAccessContext, surveyId: string) {
  if (!canAnalyzeSurveys(context)) throw new Error("You do not have permission to analyze survey results.");
  const survey = await getSurveyById(context, surveyId);
  if (!survey) throw new Error("Survey not found or you do not have access.");
  const [participation, answers, departments] = await Promise.all([
    getPool().query(
      `SELECT COUNT(*)::int AS invited,
              COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
              COUNT(*) FILTER (WHERE status = 'in_progress')::int AS "inProgress",
              COUNT(*) FILTER (WHERE status = 'not_started')::int AS "notStarted"
       FROM survey_participation WHERE survey_id = $1::uuid`,
      [surveyId],
    ),
    getPool().query(
      `SELECT q.id AS "questionId", q.text, q.type, q.config, q.dimension,
              a.value, COUNT(*) OVER (PARTITION BY q.id)::int AS "responseCount"
       FROM survey_questions q
       LEFT JOIN survey_response_answers a ON a.question_id = q.id
         AND EXISTS (SELECT 1 FROM survey_responses r WHERE r.id = a.response_id AND r.status = 'submitted')
       WHERE q.survey_id = $1::uuid AND q.archived_at IS NULL
       ORDER BY q.sort_order, a.created_at`,
      [surveyId],
    ),
    getPool().query(
      `SELECT COALESCE((snap.employee_snapshot->>'department'), 'Unassigned') AS department,
              COUNT(*)::int AS invited,
              COUNT(*) FILTER (WHERE p.status = 'completed')::int AS completed
       FROM survey_audience_snapshots snap
       LEFT JOIN survey_participation p ON p.survey_id = snap.survey_id AND p.employee_id = snap.employee_id
       WHERE snap.survey_id = $1::uuid AND snap.included = true
       GROUP BY 1 ORDER BY invited DESC`,
      [surveyId],
    ),
  ]);
  const totals = participation.rows[0] || {};
  const invited = Number(totals.invited || 0);
  const completed = Number(totals.completed || 0);
  const threshold = survey.privacyMode === "anonymous" ? survey.anonymousThreshold : 1;
  const groupedAnswers = new Map<string, JsonRecord>();
  for (const row of answers.rows) {
    const key = String(row.questionId);
    const current = groupedAnswers.get(key) || {
      questionId: key,
      text: row.text,
      type: row.type,
      config: row.config,
      dimension: row.dimension,
      responseCount: 0,
      values: [],
    };
    if (row.value !== null && row.value !== undefined) {
      (current.values as unknown[]).push(row.value);
    }
    current.responseCount = (current.values as unknown[]).length;
    groupedAnswers.set(key, current);
  }
  const questionResults = [...groupedAnswers.values()].map((question) => {
    const count = Number(question.responseCount);
    if (count < threshold) {
      return {
        questionId: question.questionId,
        text: question.text,
        type: question.type,
        responseCount: count,
        suppressed: true,
        suppressionReason: `Fewer than ${threshold} responses`,
      };
    }
    const values = question.values as unknown[];
    const distribution = new Map<string, number>();
    for (const value of values.flatMap((item) => Array.isArray(item) ? item : [item])) {
      const label = typeof value === "object" ? JSON.stringify(value) : String(value);
      distribution.set(label, (distribution.get(label) || 0) + 1);
    }
    const numeric = values.map(Number).filter(Number.isFinite);
    return {
      questionId: question.questionId,
      text: question.text,
      type: question.type,
      dimension: question.dimension,
      responseCount: count,
      suppressed: false,
      distribution: [...distribution.entries()].map(([label, value]) => ({ label, value })),
      average: numeric.length === values.length && numeric.length > 0
        ? Number((numeric.reduce((sum, value) => sum + value, 0) / numeric.length).toFixed(2))
        : null,
    };
  });
  return {
    survey: {
      id: survey.id,
      title: survey.title,
      privacyMode: survey.privacyMode,
      anonymousThreshold: survey.anonymousThreshold,
    },
    participation: {
      invited,
      completed,
      inProgress: Number(totals.inProgress || 0),
      notStarted: Number(totals.notStarted || 0),
      responseRate: invited === 0 ? null : Math.round((completed / invited) * 100),
    },
    departmentBreakdown: departments.rows.map((row) => ({
      department: row.department,
      invited: Number(row.invited),
      completed: Number(row.completed),
      responseRate: Number(row.invited) === 0 ? null : Math.round((Number(row.completed) / Number(row.invited)) * 100),
      suppressed: survey.privacyMode === "anonymous" && Number(row.completed) < threshold,
    })).map((row) => row.suppressed ? { ...row, responseRate: null } : row),
    questionResults,
  };
}

export async function listSurveyTemplates() {
  const result = await getPool().query(
    `SELECT id, name, description, category, tags, scope, version, definition,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM survey_templates
     WHERE is_archived = false
     ORDER BY CASE scope WHEN 'global' THEN 0 ELSE 1 END, category, name`,
  );
  return result.rows;
}
