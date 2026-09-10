import { getJsonArray, getJsonErrorMessage, getJsonString, isJsonObject, readJsonObject, readJsonOrFallback } from "@/lib/response-json";

export const AUTOMATION_UPLOAD_MAX_FILE_SIZE = 500 * 1024 * 1024;

interface AutomationUploadQueueInput {
  file: File;
  targetPositionId: string;
  uploadResult: {
    file_name: string;
    file_path: string;
  };
}

interface AutomationUploadFileResult {
  file_name: string;
  file_path: string;
}

function normalizeAutomationUploadResult(value: unknown): AutomationUploadFileResult | null {
  if (!isJsonObject(value)) {
    return null;
  }

  const result = getJsonArray(value, 'results')?.find(isJsonObject);
  if (!result || getJsonString(result, 'status') !== 'success') {
    const error = result ? getJsonString(result, 'error') : undefined;
    if (error) {
      throw new Error(error);
    }
    return null;
  }

  const fileName = getJsonString(result, 'file_name');
  const filePath = getJsonString(result, 'file_path');
  return fileName && filePath ? { file_name: fileName, file_path: filePath } : null;
}

export function validateAutomationUploadFile(file: File) {
  if (file.type !== 'application/pdf') {
    return `${file.name}: Invalid file type (PDF only)`;
  }

  if (file.size > AUTOMATION_UPLOAD_MAX_FILE_SIZE) {
    return `${file.name}: File too large (max ${AUTOMATION_UPLOAD_MAX_FILE_SIZE / (1024 * 1024)}MB)`;
  }

  return null;
}

export async function uploadAutomationResumeFile(file: File) {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('file', file);

  const uploadResponse = await fetch('/api/upload-queue/upload-file', {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(await readErrorMessage(uploadResponse, 'File upload failed'));
  }

  const result = normalizeAutomationUploadResult(
    await readJsonOrFallback<unknown>(uploadResponse, {})
  );
  if (!result) {
    throw new Error('File upload failed');
  }

  return result;
}

export async function enqueueAutomationUpload({
  file,
  targetPositionId,
  uploadResult,
}: AutomationUploadQueueInput) {
  const now = new Date().toISOString();
  const queueResponse = await fetch('/api/upload-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_name: uploadResult.file_name,
      file_size: file.size,
      status: 'queued',
      source: 'automation',
      upload_id: `${uploadResult.file_name}-${now}`,
      upload_date: now,
      file_path: uploadResult.file_path,
      webhook_payload: {
        targetPositionId: targetPositionId || null,
        automation: true,
      },
    }),
  });

  if (!queueResponse.ok) {
    throw new Error(await readErrorMessage(queueResponse, 'Failed to add file to upload queue'));
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  const errorData = await readJsonObject(response.clone());
  if (Object.keys(errorData).length > 0) {
    console.error('Automation upload API error:', errorData);
    return getJsonErrorMessage(errorData, fallback);
  }

  console.error('Automation upload API error (non-JSON):', response);
  return fallback;
}
