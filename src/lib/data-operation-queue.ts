import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';

import { applicantImportSchema } from '@/app/api/applicants/import/applicants-import-schema';
import { filterImportRowsWithRequiredFields, parseApplicantImportFile } from '@/app/api/applicants/import/applicants-import-file-parser';
import { importApplicantsToDatabase } from '@/app/api/applicants/import/applicants-import-db';
import { buildApplicantsExportFilterQuery } from '@/app/api/applicants/export/applicants-export-filters';
import { queryApplicantsForExport } from '@/app/api/applicants/export/applicants-export-data';
import { convertToCsv, createApplicantsExportExcelBuffer, transformApplicantForExport } from '@/app/api/applicants/export/applicants-export-format';
import { parseCsvImportFile } from '@/app/api/positions/import/positions-import-csv';
import { executePositionImport } from '@/app/api/positions/import/positions-import-batch';
import { importPositionsArraySchema } from '@/app/api/positions/import/positions-import-schema';
import { getPool, type DbClient } from '@/lib/db';
import { logAudit, logAuditEvent } from '@/lib/auditLog';
import { getDefaultMatchCriteria, getSystemSetting } from '@/lib/systemSettings';
import { createBusinessTransferPackage, DATA_TRANSFER_DOMAINS, importAllDataModels, parseBusinessTransferPackage, type DataTransferDomain } from '@/lib/data-model-backup';

export type DataOperation = 'import' | 'export';
export type DataOperationEntity = 'applicants' | 'positions' | 'system-transfer';

export interface DataOperationQueueSettings {
  maxConcurrentJobs: number;
  maxQueuedJobsPerUser: number;
  maxImportFileSizeBytes: number;
  retentionDays: number;
}

interface ClaimedJob {
  id: string;
  operation: DataOperation;
  entityType: DataOperationEntity;
  format: string | null;
  originalFileName: string | null;
  inputMimeType: string | null;
  inputData: Buffer | null;
  parameters: Record<string, unknown> | null;
  requestedById: string;
  requestedByName: string;
}

function boundedNumber(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.floor(parsed))) : fallback;
}

export async function getDataOperationQueueSettings(): Promise<DataOperationQueueSettings> {
  const [concurrency, perUser, sizeMb, retention] = await Promise.all([
    getSystemSetting('dataOperationsMaxConcurrentJobs'),
    getSystemSetting('dataOperationsMaxQueuedJobsPerUser'),
    getSystemSetting('dataOperationsMaxImportFileSizeMb'),
    getSystemSetting('dataOperationsJobRetentionDays'),
  ]);
  return resolveDataOperationQueueSettings({ concurrency, perUser, sizeMb, retention });
}

export function resolveDataOperationQueueSettings(values: { concurrency: string | null; perUser: string | null; sizeMb: string | null; retention: string | null }): DataOperationQueueSettings {
  return {
    maxConcurrentJobs: boundedNumber(values.concurrency, 2, 1, 20),
    maxQueuedJobsPerUser: boundedNumber(values.perUser, 10, 1, 100),
    maxImportFileSizeBytes: boundedNumber(values.sizeMb, 10, 1, 100) * 1024 * 1024,
    retentionDays: boundedNumber(values.retention, 14, 1, 90),
  };
}

export async function enqueueDataOperation(input: {
  operation: DataOperation;
  entityType: DataOperationEntity;
  format?: string;
  file?: File;
  parameters?: Record<string, unknown>;
  requestedById: string;
}) {
  const settings = await getDataOperationQueueSettings();
  if (input.file && input.file.size > settings.maxImportFileSizeBytes) {
    throw new Error(`File too large. Maximum size is ${Math.floor(settings.maxImportFileSizeBytes / 1024 / 1024)} MB.`);
  }
  const client = await getPool().connect();
  try {
    const countResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM "data_operation_jobs" WHERE "requested_by_id" = $1 AND status IN ('pending', 'processing')`,
      [input.requestedById]
    );
    if (Number(countResult.rows[0]?.count || 0) >= settings.maxQueuedJobsPerUser) {
      throw new Error(`You already have ${settings.maxQueuedJobsPerUser} active jobs. Wait for one to finish before adding another.`);
    }
    const id = uuidv4();
    const fileBuffer = input.file ? Buffer.from(await input.file.arrayBuffer()) : null;
    await client.query(
      `INSERT INTO "data_operation_jobs" (id, operation, "entity_type", format, status, "original_file_name", "input_mime_type", "input_file_size", "input_data", parameters, "requested_by_id", "created_at", "updated_at")
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [id, input.operation, input.entityType, input.format || null, input.file?.name || null, input.file?.type || null, input.file?.size || null, fileBuffer, input.parameters || {}, input.requestedById]
    );
    return { id, settings };
  } finally {
    client.release();
  }
}

async function claimNextJob(settings: DataOperationQueueSettings): Promise<ClaimedJob | null> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [19384721]);
    const active = await client.query(`SELECT COUNT(*)::int AS count FROM "data_operation_jobs" WHERE status = 'processing'`);
    if (Number(active.rows[0]?.count || 0) >= settings.maxConcurrentJobs) {
      await client.query('COMMIT');
      return null;
    }
    const result = await client.query(
      `SELECT j.id, j.operation, j."entity_type" AS "entityType", j.format, j."original_file_name" AS "originalFileName",
              j."input_mime_type" AS "inputMimeType", j."input_data" AS "inputData", j.parameters,
              j."requested_by_id" AS "requestedById", COALESCE(u.name, u.email) AS "requestedByName"
       FROM "data_operation_jobs" j JOIN "User" u ON u.id = j."requested_by_id"
       WHERE j.status = 'pending'
         AND j.operation IN ('import', 'export')
         AND j."entity_type" IN ('applicants', 'positions', 'system-transfer')
       ORDER BY j."created_at" ASC FOR UPDATE OF j SKIP LOCKED LIMIT 1`
    );
    const job = result.rows[0] as ClaimedJob | undefined;
    if (!job) {
      await client.query('COMMIT');
      return null;
    }
    await client.query(`UPDATE "data_operation_jobs" SET status = 'processing', progress = 5, "started_at" = NOW(), attempts = attempts + 1, "updated_at" = NOW() WHERE id = $1`, [job.id]);
    await client.query('COMMIT');
    return job;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function completeJob(job: ClaimedJob, output: { result: Record<string, unknown>; data?: Buffer; filename?: string; mimeType?: string }) {
  const client = await getPool().connect();
  try {
    await client.query(
      `UPDATE "data_operation_jobs" SET status = 'completed', progress = 100, result = $2, "output_data" = $3,
       "output_file_name" = $4, "output_mime_type" = $5, "output_file_size" = $6, "completed_at" = NOW(), "updated_at" = NOW() WHERE id = $1`,
      [job.id, output.result, output.data || null, output.filename || null, output.mimeType || null, output.data?.length || null]
    );
  } finally { client.release(); }
  await logAudit('AUDIT', `${job.entityType} ${job.operation} queue job completed for ${job.requestedByName}`, 'DataOperations:Queue', job.requestedById, { jobId: job.id, ...output.result });
}

async function failJob(job: ClaimedJob, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const client = await getPool().connect();
  try {
    await client.query(`UPDATE "data_operation_jobs" SET status = 'failed', error = $2, "completed_at" = NOW(), "updated_at" = NOW() WHERE id = $1`, [job.id, message]);
  } finally { client.release(); }
  await logAudit('ERROR', `${job.entityType} ${job.operation} queue job failed: ${message}`, 'DataOperations:Queue', job.requestedById, { jobId: job.id });
}

async function processApplicantImport(job: ClaimedJob) {
  if (!job.inputData || !job.originalFileName) throw new Error('The queued import file is missing.');
  const file = new File([new Uint8Array(job.inputData)], job.originalFileName, { type: job.inputMimeType || 'application/octet-stream' });
  const parsed = await parseApplicantImportFile(file);
  const rows = filterImportRowsWithRequiredFields(parsed.applicants);
  const validated = rows.map((row, index) => ({ index, row, parsed: applicantImportSchema.safeParse(row) }));
  const invalid = validated.filter((item) => !item.parsed.success);
  if (invalid.length) throw new Error(`Validation failed for ${invalid.length} row(s); first invalid spreadsheet row is ${invalid[0].index + 2}.`);
  const applicants = validated.flatMap((item) => item.parsed.success ? [item.parsed.data] : []);
  const results = await importApplicantsToDatabase(applicants, { actingUserId: job.requestedById, jobId: job.id });
  await completeJob(job, { result: { ...results, totalRows: parsed.totalRows } });
}

async function processPositionImport(job: ClaimedJob) {
  if (!job.inputData || !job.originalFileName) throw new Error('The queued import file is missing.');
  const file = new File([new Uint8Array(job.inputData)], job.originalFileName, { type: job.inputMimeType || 'text/csv' });
  const defaultMatchCriteria = await getDefaultMatchCriteria();
  const queueSettings = await getDataOperationQueueSettings();
  const parsed = await parseCsvImportFile(file, defaultMatchCriteria, queueSettings.maxImportFileSizeBytes);
  if (!parsed.ok) throw new Error(String(parsed.body.message || 'Could not parse position import.'));
  const validated = importPositionsArraySchema.parse(parsed.positions);
  const response = await executePositionImport({ positions: validated, defaultMatchCriteria, actingUserId: job.requestedById, actingUserName: job.requestedByName, auditInput: { jobId: job.id }, successAuditLabel: 'Queued position import completed', timeoutMessage: 'Queued import exceeded the processing time limit.' });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(result.message || result.error || 'Position import failed.'));
  const client = await getPool().connect();
  try {
    for (const position of validated) {
      const found = await client.query(`SELECT id FROM "Position" WHERE title = $1 AND department IS NOT DISTINCT FROM $2 LIMIT 1`, [position.title, position.department]);
      if (found.rows[0]?.id) await logAuditEvent(job.requestedById, 'IMPORTED_CREATE_OR_MATCH', 'Position', found.rows[0].id, { jobId: job.id, importedAttributes: position });
    }
  } finally { client.release(); }
  await completeJob(job, { result });
}

async function exportApplicants(job: ClaimedJob) {
  const params = new URLSearchParams();
  Object.entries(job.parameters || {}).forEach(([key, value]) => { if (typeof value === 'string' && value) params.set(key, value); });
  const { whereClause, queryParams } = buildApplicantsExportFilterQuery(params);
  const isJobMatchEnabled = await getSystemSetting('jobMatchFeatureEnabled') !== 'false';
  const client = await getPool().connect();
  try {
    const rows = await queryApplicantsForExport(client, whereClause, queryParams, isJobMatchEnabled);
    const data = rows.rows.map((row) => transformApplicantForExport(row, isJobMatchEnabled));
    const isCsv = job.format === 'csv';
    const output = isCsv ? Buffer.from(convertToCsv(data), 'utf8') : Buffer.from(await createApplicantsExportExcelBuffer(data, isJobMatchEnabled));
    await completeJob(job, { result: { exportCount: data.length, format: isCsv ? 'CSV' : 'Excel' }, data: output, filename: `applicants_export_${new Date().toISOString().slice(0, 10)}.${isCsv ? 'csv' : 'xlsx'}`, mimeType: isCsv ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } finally { client.release(); }
}

async function exportPositions(job: ClaimedJob) {
  const client = await getPool().connect();
  try {
    const result = await client.query(`SELECT * FROM "Position" ORDER BY "createdAt" DESC`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Positions');
    if (result.rows.length) {
      const headers = Object.keys(result.rows[0]);
      sheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(15, header.length + 2) }));
      sheet.addRows(result.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : typeof value === 'object' && value !== null ? JSON.stringify(value) : value]))));
    }
    const output = Buffer.from(await workbook.xlsx.writeBuffer());
    await completeJob(job, { result: { exportCount: result.rows.length, format: 'Excel' }, data: output, filename: `positions_export_${new Date().toISOString().slice(0, 10)}.xlsx`, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } finally { client.release(); }
}

async function exportDataModels(job: ClaimedJob) {
  const client = await getPool().connect();
  try {
    const requested = Array.isArray(job.parameters?.domains) ? job.parameters.domains : DATA_TRANSFER_DOMAINS;
    const domains = requested.filter((value): value is DataTransferDomain => typeof value === 'string' && DATA_TRANSFER_DOMAINS.includes(value as DataTransferDomain));
    const output = await createBusinessTransferPackage(client, domains);
    await completeJob(job, { result: { format: 'JSONL', scope: 'business-data-transfer', domains }, data: output, filename: `hrive_business_data_${new Date().toISOString().slice(0, 10)}.jsonl`, mimeType: 'application/jsonl' });
  } finally { client.release(); }
}

async function importDataModels(job: ClaimedJob) {
  if (!job.inputData) throw new Error('The queued backup file is missing.');
  const backup = await parseBusinessTransferPackage(job.inputData);
  const client = await getPool().connect();
  try {
    const result = await importAllDataModels(client, backup);
    await completeJob(job, { result: { ...result, scope: 'business-data-transfer', domains: backup.domains } });
  } finally { client.release(); }
}

async function processJob(job: ClaimedJob) {
  if (job.entityType === 'system-transfer') return job.operation === 'import' ? importDataModels(job) : exportDataModels(job);
  if (job.operation === 'import' && job.entityType === 'applicants') return processApplicantImport(job);
  if (job.operation === 'import' && job.entityType === 'positions') return processPositionImport(job);
  if (job.operation === 'export' && job.entityType === 'applicants') return exportApplicants(job);
  return exportPositions(job);
}

export async function processDataOperationQueue() {
  const settings = await getDataOperationQueueSettings();
  await cleanupExpiredJobs(settings.retentionDays);
  const slots = Array.from({ length: settings.maxConcurrentJobs }, async () => {
    while (true) {
      const job = await claimNextJob(settings);
      if (!job) return;
      try { await processJob(job); } catch (error) { await failJob(job, error); }
    }
  });
  await Promise.all(slots);
}

async function cleanupExpiredJobs(retentionDays: number) {
  const client = await getPool().connect();
  try {
    await client.query(`DELETE FROM "data_operation_jobs" WHERE status IN ('completed', 'failed', 'cancelled') AND "completed_at" < NOW() - ($1::text || ' days')::interval`, [retentionDays]);
  } finally { client.release(); }
}

export async function getDataOperationJobs(userId: string, includeAllUsers: boolean) {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT j.id, j.operation, j."entity_type" AS "entityType", j.format, j.status, j.progress,
              j."original_file_name" AS "originalFileName", j."input_file_size"::text AS "inputFileSize",
              j."output_file_name" AS "outputFileName", j."output_file_size"::text AS "outputFileSize",
              j.result, j.error, j.attempts, j."created_at" AS "createdAt", j."started_at" AS "startedAt", j."completed_at" AS "completedAt",
              u.id AS "requestedById", u.name AS "requestedByName", u.email AS "requestedByEmail"
       FROM "data_operation_jobs" j JOIN "User" u ON u.id = j."requested_by_id"
       WHERE ($2::boolean OR j."requested_by_id" = $1) ORDER BY j."created_at" DESC LIMIT 200`,
      [userId, includeAllUsers]
    );
    return result.rows;
  } finally { client.release(); }
}

export async function getDataOperationDownload(jobId: string, userId: string, includeAllUsers: boolean) {
  const client = await getPool().connect();
  try {
    const result = await client.query(`SELECT "output_data" AS data, "output_file_name" AS filename, "output_mime_type" AS "mimeType" FROM "data_operation_jobs" WHERE id = $1 AND status = 'completed' AND ($3::boolean OR "requested_by_id" = $2)`, [jobId, userId, includeAllUsers]);
    return result.rows[0] as { data: Buffer; filename: string; mimeType: string } | undefined;
  } finally { client.release(); }
}
