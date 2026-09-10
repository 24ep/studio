import type { UploadQueuePatchBuildResult } from './upload-queue-item-types';

const PATCHABLE_UPLOAD_QUEUE_COLUMNS = new Set([
  'file_name',
  'file_size',
  'status',
  'error',
  'error_details',
  'source',
  'source_id',
  'sub_source',
  'upload_date',
  'completed_date',
  'upload_id',
  'created_by',
  'file_path',
  'webhook_payload',
  'retry_count',
  'position_id',
  'process_date',
  'email_date',
  'email_subject',
  'email_id',
  'email_metadata',
]);

export function buildUploadQueuePatch(data: Record<string, unknown>): UploadQueuePatchBuildResult {
  const invalidFields = Object.keys(data).filter(key => !PATCHABLE_UPLOAD_QUEUE_COLUMNS.has(key));
  if (invalidFields.length > 0) {
    return { ok: false, invalidFields };
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  Object.entries(data).forEach(([key, value], index) => {
    fields.push(`${key} = $${index + 1}`);
    values.push(value);
  });

  return { ok: true, fields, values };
}
