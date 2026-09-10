import { randomUUID } from "node:crypto";

import { getPool } from "@/lib/db";
import type { SurveyAccessContext } from "./survey-service";
import { getSurveyById, updateSurvey } from "./survey-service";
import type { z } from "zod";
import type { surveyDefinitionImportSchema, surveyOperationSchema } from "./survey-contracts";

type SurveyOperation = z.infer<typeof surveyOperationSchema>;
type SurveyDefinitionImport = z.infer<typeof surveyDefinitionImportSchema>;

export async function getSurveyOperations(context: SurveyAccessContext, surveyId: string) {
  const survey = await getSurveyById(context, surveyId);
  if (!survey) throw new Error("Survey not found or you do not have access.");
  const [versions, reminders, releases, actionPlans, distributions, audit, responses] = await Promise.all([
    getPool().query(`SELECT id, version, status, published_at AS "publishedAt", created_at AS "createdAt" FROM survey_versions WHERE survey_id = $1::uuid ORDER BY version DESC`, [surveyId]),
    getPool().query(`SELECT id, name, trigger_type AS "triggerType", target_statuses AS "targetStatuses", channel, scheduled_at AS "scheduledAt", sent_at AS "sentAt", status FROM survey_reminders WHERE survey_id = $1::uuid ORDER BY created_at DESC`, [surveyId]),
    getPool().query(`SELECT id, audience, scope, status, approved_at AS "approvedAt", released_at AS "releasedAt", created_at AS "createdAt" FROM survey_result_releases WHERE survey_id = $1::uuid ORDER BY created_at DESC`, [surveyId]),
    getPool().query(`SELECT id, title, description, owner_user_id AS "ownerUserId", due_at AS "dueAt", status, priority, source, created_at AS "createdAt" FROM survey_action_plans WHERE survey_id = $1::uuid ORDER BY created_at DESC`, [surveyId]),
    getPool().query(`SELECT id, channel, status, scheduled_at AS "scheduledAt", sent_at AS "sentAt", sent_count AS "sentCount", failed_count AS "failedCount" FROM survey_distributions WHERE survey_id = $1::uuid ORDER BY created_at DESC`, [surveyId]),
    getPool().query(`SELECT id, action, entity_type AS "entityType", details, created_at AS "createdAt" FROM survey_audit_logs WHERE survey_id = $1::uuid ORDER BY created_at DESC LIMIT 100`, [surveyId]),
    getPool().query(`SELECT r.id, r.status, r.privacy_mode AS "privacyMode", r.reference_code AS "referenceCode", r.started_at AS "startedAt", r.submitted_at AS "submittedAt", r.duration_seconds AS "durationSeconds", CASE WHEN r.privacy_mode = 'anonymous' OR (r.privacy_mode = 'confidential' AND $2::boolean = false) THEN NULL ELSE CONCAT_WS(' ', e.first_name, e.last_name) END AS respondent FROM survey_responses r LEFT JOIN hr_employees e ON e.id = r.respondent_employee_id WHERE r.survey_id = $1::uuid ORDER BY r.created_at DESC LIMIT 500`, [surveyId, context.isAdmin || context.permissions.includes("SURVEY_RESPONSE_CONFIDENTIAL")]),
  ]);
  return { versions: versions.rows, reminders: reminders.rows, releases: releases.rows, actionPlans: actionPlans.rows, distributions: distributions.rows, audit: audit.rows, responses: responses.rows };
}

export async function runSurveyOperation(context: SurveyAccessContext, surveyId: string, input: SurveyOperation) {
  const survey = await getSurveyById(context, surveyId);
  if (!survey) throw new Error("Survey not found or you do not have access.");
  if (input.action === "lifecycle") {
    const allowed: Record<string, string[]> = {
      draft: ["under_review", "cancelled"], under_review: ["draft", "approved", "cancelled"], approved: ["draft", "scheduled", "active", "cancelled"],
      scheduled: ["active", "paused", "cancelled"], active: ["paused", "closed", "cancelled"], paused: ["active", "closed", "cancelled"],
      closed: ["archived", "active"], cancelled: ["archived", "draft"], archived: [],
    };
    if (!(allowed[survey.status] || []).includes(input.status)) throw new Error(`A ${survey.status.replaceAll("_", " ")} survey cannot move directly to ${input.status.replaceAll("_", " ")}.`);
    const updated = await updateSurvey(context, surveyId, { expectedVersion: survey.version, status: input.status });
    if (input.status === "closed") await getPool().query(`UPDATE surveys SET closed_at = COALESCE(closed_at, NOW()) WHERE id = $1::uuid`, [surveyId]);
    if (input.status === "archived") await getPool().query(`UPDATE surveys SET archived_at = COALESCE(archived_at, NOW()) WHERE id = $1::uuid`, [surveyId]);
    return { survey: updated };
  }
  if (input.action === "reminder") {
    const result = await getPool().query(
      `INSERT INTO survey_reminders (id, survey_id, name, trigger_type, target_statuses, channel, scheduled_at, status, created_by_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING id, name, status`,
      [randomUUID(), surveyId, input.name, input.triggerType, input.targetStatuses, input.channel, input.scheduledAt || null, input.triggerType === "manual" ? "sent" : "scheduled", context.userId],
    );
    if (input.triggerType === "manual") {
      await getPool().query(`UPDATE survey_invitations SET reminder_count = reminder_count + 1, last_reminder_at = NOW(), updated_at = NOW() WHERE survey_id = $1::uuid AND status = ANY($2::text[])`, [surveyId, input.targetStatuses]);
    }
    return { reminder: result.rows[0] };
  }
  if (input.action === "action_plan") {
    const result = await getPool().query(
      `INSERT INTO survey_action_plans (id, survey_id, title, description, owner_user_id, due_at, status, priority, source, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8::jsonb,NOW(),NOW()) RETURNING *`,
      [randomUUID(), surveyId, input.title, input.description || null, input.ownerUserId, input.dueAt || null, input.priority, JSON.stringify(input.source)],
    );
    return { actionPlan: result.rows[0] };
  }
  const status = input.releaseNow ? "released" : "draft";
  const result = await getPool().query(
    `INSERT INTO survey_result_releases (id, survey_id, audience, scope, status, approved_by_id, approved_at, released_at, created_by_id, created_at, updated_at) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$7,$6,NOW(),NOW()) RETURNING *`,
    [randomUUID(), surveyId, input.audience, JSON.stringify(input.scope), status, context.userId, input.releaseNow ? new Date() : null],
  );
  return { release: result.rows[0] };
}

export async function importSurveyDefinition(context: SurveyAccessContext, surveyId: string, input: SurveyDefinitionImport) {
  const survey = await getSurveyById(context, surveyId);
  if (!survey) throw new Error("Survey not found or you do not have access.");
  const sectionIds = new Map(input.definition.sections.map(section => [section.id, randomUUID()]));
  const questionIds = new Map(input.definition.questions.map(question => [question.id, randomUUID()]));
  const importedSections = input.definition.sections.map(section => ({ ...section, id: sectionIds.get(section.id) || randomUUID() }));
  const importedQuestions = input.definition.questions.map(question => ({
    ...question,
    id: questionIds.get(question.id) || randomUUID(),
    sectionId: sectionIds.get(question.sectionId) || importedSections[0]?.id || randomUUID(),
    logic: question.logic.map(rule => ({
      ...rule,
      id: randomUUID(),
      targetQuestionId: rule.targetQuestionId ? questionIds.get(rule.targetQuestionId) : undefined,
      targetSectionId: rule.targetSectionId ? sectionIds.get(rule.targetSectionId) : undefined,
      conditions: rule.conditions.map(condition => ({ ...condition, questionId: questionIds.get(condition.questionId) || condition.questionId })),
    })),
  }));
  if (input.mode === "append") {
    const existingSections = survey.sections || [];
    const existingQuestions = survey.questions || [];
    return updateSurvey(context, surveyId, {
      expectedVersion: input.expectedVersion,
      title: input.definition.title,
      description: input.definition.description,
      introduction: input.definition.introduction,
      sections: [...existingSections, ...importedSections],
      questions: [...existingQuestions, ...importedQuestions],
    });
  }
  return updateSurvey(context, surveyId, { expectedVersion: input.expectedVersion, ...input.definition, sections: importedSections, questions: importedQuestions });
}

export async function duplicateSurvey(context: SurveyAccessContext, surveyId: string) {
  const source = await getSurveyById(context, surveyId);
  if (!source) throw new Error("Survey not found or you do not have access.");
  const client = await getPool().connect();
  const nextId = randomUUID();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO surveys (id,title,internal_name,description,introduction,type,status,privacy_mode,owner_user_id,department_owner_id,company_id,estimated_minutes,language,additional_languages,completion_message,contact_information,tags,is_required,allow_draft,allow_edit_after_submit,anonymous_threshold,results_visibility,timezone,version,created_at,updated_at) SELECT $2, title || ' (copy)', internal_name || '-copy', description, introduction, type, 'draft', privacy_mode, $3, department_owner_id, company_id, estimated_minutes, language, additional_languages, completion_message, contact_information, tags, is_required, allow_draft, allow_edit_after_submit, anonymous_threshold, results_visibility, timezone, 1, NOW(), NOW() FROM surveys WHERE id=$1::uuid`, [surveyId, nextId, context.userId]);
    const sectionMap = new Map<string, string>();
    for (const section of source.sections || []) {
      const id = randomUUID(); sectionMap.set(String(section.id), id);
      await client.query(`INSERT INTO survey_sections (id,survey_id,title,description,sort_order,conditions,randomize_questions,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,NOW(),NOW())`, [id,nextId,section.title,section.description,section.sortOrder,JSON.stringify(section.conditions || []),section.randomizeQuestions]);
    }
    for (const question of source.questions || []) {
      await client.query(`INSERT INTO survey_questions (id,survey_id,section_id,type,text,description,help_text,is_required,sort_order,config,logic,dimension,tags,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,NOW(),NOW())`, [randomUUID(),nextId,sectionMap.get(String(question.sectionId)),question.type,question.text,question.description,question.helpText,question.isRequired,question.sortOrder,JSON.stringify(question.config || {}),JSON.stringify([]),question.dimension,question.tags || []]);
    }
    await client.query("COMMIT");
    return { id: nextId };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function getSurveyExportData(context: SurveyAccessContext, surveyId: string) {
  const survey = await getSurveyById(context, surveyId);
  if (!survey) throw new Error("Survey not found or you do not have access.");
  const answers = await getPool().query(`SELECT r.id AS "responseId", r.status, r.privacy_mode AS "privacyMode", r.reference_code AS "referenceCode", r.submitted_at AS "submittedAt", CASE WHEN r.privacy_mode='anonymous' OR (r.privacy_mode='confidential' AND $2::boolean=false) THEN NULL ELSE CONCAT_WS(' ',e.first_name,e.last_name) END AS respondent, q.id AS "questionId", q.text AS question, q.type, a.value FROM survey_responses r LEFT JOIN hr_employees e ON e.id=r.respondent_employee_id LEFT JOIN survey_response_answers a ON a.response_id=r.id LEFT JOIN survey_questions q ON q.id=a.question_id WHERE r.survey_id=$1::uuid AND r.status='submitted' ORDER BY r.submitted_at,q.sort_order`, [surveyId, context.isAdmin || context.permissions.includes("SURVEY_RESPONSE_CONFIDENTIAL")]);
  return { survey, answers: answers.rows };
}
