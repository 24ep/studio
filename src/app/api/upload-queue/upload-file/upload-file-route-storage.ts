import { v4 as uuidv4 } from 'uuid';
import type { QueryResultRow } from 'pg';
import type { DbClient } from '@/lib/db';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { retryMinIOUpload, retryDatabaseOperation } from '@/lib/uploadRetry';
import { generateUniqueFilename } from '@/lib/fileUtils';
import { ALLOWED_FILE_EXTENSIONS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, type FileValidationResult, type UploadOptions, type UploadResult } from './upload-file-route-types';

function validateFile(file: File): FileValidationResult {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_FILE_EXTENSIONS.some(extension => lowerName.endsWith(extension));

  if (!ALLOWED_FILE_TYPES.includes(file.type) && !hasAllowedExtension) {
    return {
      isValid: false,
      error: `Invalid file type. Supported files: PDF, Word documents, JPG, PNG, GIF, WEBP, and BMP. Got: ${file.type || 'unknown'}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Got: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  if (!file.name || file.name.trim().length === 0) {
    return {
      isValid: false,
      error: 'File name is required',
    };
  }

  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'File name contains invalid characters',
    };
  }

  return { isValid: true };
}

type UploadQueueInsertRow = QueryResultRow & {
  id: string;
};

async function uploadToMinIO(file: File, objectName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    return retryMinIOUpload(
      async () => {
        await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Disposition': file.type === 'application/pdf'
            ? `inline; filename="${encodeURIComponent(file.name)}"`
            : `attachment; filename="${encodeURIComponent(file.name)}"`,
        });
      },
      file.name
    );
  } catch (error) {
    console.error(`[UPLOAD] Error in uploadToMinIO for ${file.name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown MinIO upload error',
    };
  }
}

async function insertIntoUploadQueue(
  client: DbClient,
  jobData: UploadOptions & {
    id: string;
    file_name: string;
    file_size: number;
    file_path: string;
  }
): Promise<{ success: boolean; error?: string; job?: unknown }> {
  const result = await retryDatabaseOperation(
    async () => {
      const response = await client.query<UploadQueueInsertRow>(
        `INSERT INTO upload_queue (
          id, file_name, file_size, status, source, upload_id, created_by,
          file_path, webhook_payload, position_id, source_id, sub_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          jobData.id,
          jobData.file_name,
          jobData.file_size,
          'queued',
          jobData.source || 'bulk',
          jobData.batch_id || uuidv4(),
          jobData.created_by,
          jobData.file_path,
          jobData.webhook_payload ? JSON.stringify(jobData.webhook_payload) : null,
          jobData.position_id || null,
          jobData.source_id || null,
          jobData.sub_source || null,
        ]
      );
      return response.rows[0];
    },
    `insert_upload_queue_${jobData.file_name}`
  );

  return {
    success: result.success,
    job: result.data,
    error: result.success ? undefined : result.error,
  };
}

export async function processFileUpload(file: File, client: DbClient, options: UploadOptions): Promise<UploadResult> {
  const jobId = uuidv4();
  const fileName = generateUniqueFilename(file.name);
  const objectName = `uploads/${fileName}`;

  const validation = validateFile(file);
  if (!validation.isValid) {
    return {
      file_name: file.name,
      status: 'failed',
      error: validation.error,
    };
  }

  const minioResult = await uploadToMinIO(file, objectName);
  if (!minioResult.success) {
    return {
      file_name: file.name,
      status: 'failed',
      error: minioResult.error,
    };
  }

  const dbResult = await insertIntoUploadQueue(client, {
    id: jobId,
    file_name: file.name,
    file_size: file.size,
    file_path: objectName,
    ...options,
  });

  if (!dbResult.success) {
    try {
      await minioClient.removeObject(MINIO_BUCKET, objectName);
    } catch (cleanupError) {
      console.error(`[UPLOAD] Failed to cleanup MinIO file after DB failure: ${objectName}`, cleanupError);
    }

    return {
      file_name: file.name,
      status: 'failed',
      error: dbResult.error,
    };
  }

  return {
    file_name: file.name,
    status: 'success',
    file_path: objectName,
    file_size: file.size,
    queue_id: jobId,
  };
}
