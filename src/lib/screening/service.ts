import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { generateTextWithProvider } from '@/lib/aiProvider';
import { getBraveSearchApiKey, getScreeningSettings } from './settings';
import { buildScreeningQueries, searchBrave, searchGdelt, searchOfficialLists } from './sources';
import { classifyScreeningText, isPotentialFinding, scoreIdentityMatch } from './classification';
import type { ScreeningIdentity, ScreeningSourceResult, ScreeningSubjectType, ScreeningTrigger } from './types';
import { z } from 'zod';

type DbRecord = Record<string, unknown>;
const aiFindingSchema = z.object({
  category: z.enum(['harassment','threat','violence','fraud','professional_misconduct','legal_record','ordinary_complaint','irrelevant']),
  allegationStatus: z.enum(['unverified','reported','official_finding']).default('unverified'),
  summary: z.string().max(1000),
  explanation: z.string().max(1500),
});

function stringsFromJson(value: unknown, keys: string[]) {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (typeof item === 'string') return [item];
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const found = keys.map(key => record[key]).find(entry => typeof entry === 'string');
    return typeof found === 'string' ? [found] : [];
  }).filter(Boolean).slice(0, 5);
}

export async function loadScreeningIdentity(subjectType: ScreeningSubjectType, subjectId: string): Promise<ScreeningIdentity | null> {
  const pool = getPool();
  if (subjectType === 'applicant') {
    const result = await pool.query(`SELECT a.name, a."parsedData", a."experienceData", a."educationData", p.title AS "jobTitle" FROM "Applicant" a LEFT JOIN "Position" p ON p.id = a."positionId" WHERE a.id = $1`, [subjectId]);
    const row = result.rows[0];
    if (!row) return null;
    const parsed = row.parsedData && typeof row.parsedData === 'object' ? row.parsedData as Record<string, unknown> : {};
    return {
      name: String(row.name), aliases: [],
      employers: stringsFromJson(row.experienceData, ['company', 'companyName', 'employer']),
      jobTitle: row.jobTitle ? String(row.jobTitle) : null,
      location: typeof parsed.location === 'string' ? parsed.location : null,
      education: stringsFromJson(row.educationData, ['institution', 'school', 'university']),
      country: typeof parsed.country === 'string' ? parsed.country : null,
    };
  }
  const result = await pool.query(`SELECT e."firstName", e."lastName", e."preferredName", e."jobTitle", e.location, e."workExperience", e.education FROM hr_employees e WHERE e.id = $1`, [subjectId]);
  const row = result.rows[0];
  if (!row) return null;
  const name = `${row.firstName || ''} ${row.lastName || ''}`.trim();
  return {
    name, aliases: row.preferredName ? [String(row.preferredName)] : [],
    employers: stringsFromJson(row.workExperience, ['company', 'companyName', 'employer']),
    jobTitle: row.jobTitle ? String(row.jobTitle) : null,
    location: row.location ? String(row.location) : null,
    education: stringsFromJson(row.education, ['institution', 'school', 'university']),
    country: null,
  };
}

export async function getActiveScreeningConsent(subjectType: ScreeningSubjectType, subjectId: string) {
  const column = subjectType === 'applicant' ? 'applicant_id' : 'employee_id';
  const result = await getPool().query(`SELECT id FROM screening_consents WHERE ${column} = $1 AND revoked_at IS NULL ORDER BY consented_at DESC LIMIT 1`, [subjectId]);
  return result.rows[0]?.id as string | undefined;
}

export async function recordScreeningConsent(input: { subjectType: ScreeningSubjectType; subjectId: string; noticeVersion?: string; captureSource: string }) {
  const id = randomUUID();
  const applicantId = input.subjectType === 'applicant' ? input.subjectId : null;
  const employeeId = input.subjectType === 'employee' ? input.subjectId : null;
  await getPool().query(`INSERT INTO screening_consents (id, applicant_id, employee_id, notice_version, capture_source, consented_at, created_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`, [id, applicantId, employeeId, input.noticeVersion || '2026-08-v1', input.captureSource]);
  const subjectColumn = input.subjectType === 'applicant' ? 'applicant_id' : 'employee_id';
  await getPool().query(`UPDATE screening_cases SET consent_id=$1, status='queued', updated_at=NOW() WHERE ${subjectColumn}=$2 AND status='consent_required'`, [id, input.subjectId]);
  return id;
}

export async function enqueueScreeningCase(input: { subjectType: ScreeningSubjectType; subjectId: string; requestedById?: string | null; triggerType: ScreeningTrigger; useAi: boolean; idempotencyKey?: string }) {
  const settings = await getScreeningSettings();
  if (!settings.enabled) throw new Error('Digital footprint screening is disabled.');
  if (input.useAi && !settings.aiAllowed) throw new Error('AI screening is not allowed by Admin Center.');
  const identity = await loadScreeningIdentity(input.subjectType, input.subjectId);
  if (!identity) throw new Error(`${input.subjectType === 'applicant' ? 'Applicant' : 'Employee'} not found.`);
  const consentId = await getActiveScreeningConsent(input.subjectType, input.subjectId);
  const status = consentId ? 'queued' : 'consent_required';
  const id = randomUUID();
  const key = input.idempotencyKey || `manual:${input.subjectType}:${input.subjectId}:${id}`;
  const applicantId = input.subjectType === 'applicant' ? input.subjectId : null;
  const employeeId = input.subjectType === 'employee' ? input.subjectId : null;
  const result = await getPool().query(`
    INSERT INTO screening_cases (id, applicant_id, employee_id, requested_by_id, trigger_type, use_ai, ai_status, status, identity_snapshot, sources_checked, idempotency_key, consent_id, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'[]'::jsonb,$10,$11,NOW(),NOW())
    ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = screening_cases.updated_at
    RETURNING *`, [id, applicantId, employeeId, input.requestedById || null, input.triggerType, input.useAi, input.useAi ? 'pending' : 'not_requested', status, JSON.stringify(identity), key, consentId || null]);
  await logAudit('AUDIT', `Digital footprint screening ${status === 'queued' ? 'queued' : 'awaiting consent'}.`, 'Screening:Enqueue', input.requestedById || null, { caseId: result.rows[0].id, subjectType: input.subjectType, subjectId: input.subjectId, useAi: input.useAi, triggerType: input.triggerType });
  return result.rows[0];
}

export async function enqueueAutomaticApplicantScreening(applicantId: string, triggerType: Exclude<ScreeningTrigger, 'manual'> = 'applicant_created') {
  const settings = await getScreeningSettings();
  if (!settings.enabled || !settings.autoApplicantEnabled) return null;
  return enqueueScreeningCase({ subjectType: 'applicant', subjectId: applicantId, triggerType, useAi: settings.aiAllowed && settings.automaticAiDefault, idempotencyKey: `automatic:applicant:${applicantId}:v1` });
}

function safeDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function aiClassify(result: ScreeningSourceResult, identity: ScreeningIdentity) {
  const prompt = `Return JSON only with category, allegationStatus, summary, explanation. Analyze only job-relevant public adverse-media text. Never infer protected characteristics or recommend an employment decision. Identity: ${JSON.stringify(identity)}. Source: ${JSON.stringify({ title: result.title, publisher: result.publisher, snippet: result.snippet })}`;
  const response = await executeWithApiKeyFallback((key, model, provider) => generateTextWithProvider(provider, key, model, prompt), 'Digital footprint screening');
  if (!response.success || !response.data) return null;
  try {
    const cleaned = String(response.data).replace(/^```json\s*|\s*```$/g, '');
    return aiFindingSchema.parse(JSON.parse(cleaned));
  } catch { return null; }
}

async function runClaimedCase(row: DbRecord) {
  const settings = await getScreeningSettings();
  const braveApiKey = settings.enabledSources.includes('brave') ? await getBraveSearchApiKey() : null;
  const identity = row.identity_snapshot as ScreeningIdentity;
  const queries = buildScreeningQueries(identity, settings.maxQueries);
  const results: ScreeningSourceResult[] = [];
  const checked = new Set<string>();
  const providerErrors: string[] = [];
  const monthlyUsage = await getPool().query(`SELECT COALESCE(SUM(query_count),0)::int AS used FROM screening_cases WHERE created_at >= date_trunc('month', NOW())`);
  const projectedQueries = queries.length * settings.enabledSources.filter(source => source === 'brave' || source === 'gdelt').length;
  if (Number(monthlyUsage.rows[0]?.used || 0) + projectedQueries > settings.monthlyQueryLimit) throw new Error('Monthly screening query limit reached.');
  for (const query of queries) {
    if (settings.enabledSources.includes('brave') && settings.braveConfigured) {
      try { results.push(...await searchBrave(query, settings.maxResultsPerQuery, braveApiKey)); checked.add('brave'); }
      catch (error) { providerErrors.push(error instanceof Error ? error.message : String(error)); }
    }
    if (settings.enabledSources.includes('gdelt')) {
      try { results.push(...await searchGdelt(query, settings.maxResultsPerQuery)); checked.add('gdelt'); }
      catch (error) { providerErrors.push(error instanceof Error ? error.message : String(error)); }
    }
  }
  const officialSources = settings.enabledSources.filter(source => ['un','ofac','uk','thai_sec'].includes(source));
  if (officialSources.length) {
    results.push(...await searchOfficialLists(identity, officialSources)); officialSources.forEach(source => checked.add(source));
  }
  if (checked.size === 0 && providerErrors.length) throw new Error(providerErrors.join('; ').slice(0, 500));
  const unique = [...new Map(results.map(result => [result.url, result])).values()];
  let findingCount = 0;
  let aiFailed = false;
  for (const result of unique.filter(isPotentialFinding)) {
    const match = scoreIdentityMatch(identity, result);
    if (match.signals.length < 2 || match.confidence < settings.identityThreshold) continue;
    const ai = row.use_ai ? await aiClassify(result, identity).catch(() => null) : null;
    if (row.use_ai && !ai) aiFailed = true;
    const category = ai?.category || classifyScreeningText(`${result.title} ${result.snippet || ''}`);
    await getPool().query(`INSERT INTO screening_findings (id, case_id, source_type, source_url, source_title, publisher, published_at, category, allegation_status, identity_confidence, matching_signals, review_status, ai_summary, ai_explanation, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,'pending',$12,$13,NOW(),NOW()) ON CONFLICT (case_id, source_url) DO NOTHING`, [randomUUID(), row.id, result.sourceType, result.url, result.title, result.publisher || null, safeDate(result.publishedAt), category, ai?.allegationStatus || 'unverified', match.confidence, JSON.stringify(match.signals), ai?.summary || null, ai?.explanation || null]);
    findingCount += 1;
  }
  const status = findingCount ? 'review_required' : 'completed_no_reliable_results';
  await getPool().query(`UPDATE screening_cases SET status=$2, ai_status=$3, sources_checked=$4::jsonb, query_count=$5, completed_at=NOW(), updated_at=NOW() WHERE id=$1`, [row.id, status, row.use_ai ? (aiFailed ? 'failed' : 'completed') : 'not_requested', JSON.stringify([...checked]), queries.length * checked.size,]);
}

export async function processNextScreeningCase() {
  const retention = (await getScreeningSettings()).retentionDays;
  await getPool().query(`DELETE FROM screening_cases WHERE created_at < NOW() - ($1::text || ' days')::interval`, [retention]);
  const client = await getPool().connect();
  let row: DbRecord | undefined;
  try {
    await client.query('BEGIN');
    const result = await client.query(`SELECT * FROM screening_cases WHERE status='queued' AND attempt_count < max_attempts ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`);
    row = result.rows[0];
    if (!row) { await client.query('COMMIT'); return null; }
    await client.query(`UPDATE screening_cases SET status='processing', attempt_count=attempt_count+1, started_at=COALESCE(started_at,NOW()), updated_at=NOW() WHERE id=$1`, [row.id]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  try {
    await runClaimedCase(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const result = await getPool().query(`UPDATE screening_cases SET status=CASE WHEN attempt_count >= max_attempts THEN 'failed' ELSE 'queued' END, error_code='PROVIDER_ERROR', error_message=$2, updated_at=NOW() WHERE id=$1 RETURNING status`, [row.id, message.slice(0, 500)]);
    await logAudit('ERROR', 'Digital footprint screening processing failed.', 'Screening:Processor', null, { caseId: row.id, error: message, status: result.rows[0]?.status });
  }
  return row.id as string;
}

export async function listScreeningCases(filters: { subjectType?: ScreeningSubjectType; subjectId?: string; status?: string }) {
  const values: unknown[] = [];
  const where: string[] = [];
  if (filters.subjectType && filters.subjectId) { values.push(filters.subjectId); where.push(filters.subjectType === 'applicant' ? `c.applicant_id=$${values.length}` : `c.employee_id=$${values.length}`); }
  if (filters.status) { values.push(filters.status); where.push(`c.status=$${values.length}`); }
  const result = await getPool().query(`SELECT c.*, COALESCE(json_agg(f ORDER BY f.created_at) FILTER (WHERE f.id IS NOT NULL), '[]') AS findings FROM screening_cases c LEFT JOIN screening_findings f ON f.case_id=c.id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`, values);
  return result.rows;
}

export async function getScreeningCase(id: string) {
  return (await getPool().query(`SELECT c.*, COALESCE(json_agg(f ORDER BY f.created_at) FILTER (WHERE f.id IS NOT NULL), '[]') AS findings FROM screening_cases c LEFT JOIN screening_findings f ON f.case_id=c.id WHERE c.id=$1 GROUP BY c.id`, [id])).rows[0] || null;
}

export async function reviewScreeningFinding(id: string, reviewerId: string, input: { reviewStatus: string; reviewedExcerpt?: string }) {
  const allowed = ['confirmed', 'wrong_person', 'irrelevant', 'disputed', 'unverified'];
  if (!allowed.includes(input.reviewStatus)) throw new Error('Invalid review status.');
  const result = await getPool().query(`UPDATE screening_findings SET review_status=$2, reviewed_excerpt=$3, reviewed_by_id=$4, reviewed_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`, [id, input.reviewStatus, input.reviewedExcerpt?.slice(0, 1500) || null, reviewerId]);
  if (!result.rows[0]) throw new Error('Finding not found.');
  await logAudit('AUDIT', 'Digital footprint finding reviewed.', 'Screening:Review', reviewerId, { findingId: id, reviewStatus: input.reviewStatus });
  await getPool().query(`UPDATE screening_cases c SET status='completed', completed_at=COALESCE(completed_at,NOW()), updated_at=NOW() WHERE c.id=$1 AND NOT EXISTS (SELECT 1 FROM screening_findings f WHERE f.case_id=c.id AND f.review_status='pending')`, [result.rows[0].case_id]);
  return result.rows[0];
}
