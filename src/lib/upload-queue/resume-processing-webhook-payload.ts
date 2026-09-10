import { getSignedUrl } from '@/lib/minio';

const SIGNED_URL_EXPIRATION_SECONDS = 86400;

type WebhookPayloadRecord = Record<string, unknown> & {
  additionalAttachment?: unknown;
  additionalAttachments?: unknown;
  request_type?: string;
  targetPositionId?: string;
  Applicant_id?: string;
  sourceId?: string;
};

type ResumeProcessingUploadQueueJob = Record<string, unknown> & {
  id: string;
  file_path: string;
  webhook_payload?: unknown;
  position_id?: string | null;
  source_id?: string | null;
  subSource?: string | null;
};

type AdditionalAttachment = {
  path: string;
  name?: string;
  size?: number;
  type?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getWebhookPayload(value: unknown): WebhookPayloadRecord {
  return isRecord(value) ? value : {};
}

function isAdditionalAttachment(value: unknown): value is AdditionalAttachment {
  return isRecord(value) && typeof value.path === 'string';
}

export async function buildResumeProcessingWebhookRequest(
  job: ResumeProcessingUploadQueueJob,
  responseMode: string,
  webhookToken: string
) {
  const webhookPayload = getWebhookPayload(job.webhook_payload);
  const inputs = await buildResumeProcessingInputs(job);
  const originalPayload = {
    inputs,
    response_mode: responseMode,
    user: job.id,
    request_type: webhookPayload.request_type || 'create',
  };

  const payloadWithIdempotency = {
    ...originalPayload,
    idempotency_key: `${job.id}-single`,
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (webhookToken) {
    headers.Authorization = `Bearer ${webhookToken}`;
  }

  return { payloadWithIdempotency, headers };
}

async function buildResumeProcessingInputs(job: ResumeProcessingUploadQueueJob) {
  const publicUrl = await getPrimaryFileUrl(job.file_path);
  const webhookPayload = getWebhookPayload(job.webhook_payload);
  const attachments = await collectAdditionalAttachments(webhookPayload);

  return {
    cv_url: publicUrl,
    applied_position_id: webhookPayload.targetPositionId || job.position_id,
    jobId: job.id,
    meta: job.meta,
    filename: job.filename,
    mimetype: job.mimetype,
    Applicant_id: webhookPayload.Applicant_id || null,
    source_id: webhookPayload.sourceId || job.source_id || null,
    sub_source: job.subSource || null,
    upload_date: job.upload_date,
    email_date: job.email_date || null,
    email_subject: job.email_subject || null,
    email_id: job.email_id || null,
    email_metadata: job.email_metadata || null,
    additionalAttachments: attachments.rawList.length ? attachments.rawList : [],
  };
}

async function getPrimaryFileUrl(filePath: string) {
  if (filePath.startsWith('http')) {
    return filePath;
  }

  try {
    return await getSignedUrl(filePath, SIGNED_URL_EXPIRATION_SECONDS);
  } catch (error) {
    console.error(`[UPLOAD-QUEUE] Failed to generate signed URL for ${filePath}:`, error);
    return getServerFileUrl(filePath);
  }
}

async function collectAdditionalAttachments(webhookPayload: WebhookPayloadRecord) {
  const attachments = [
    webhookPayload.additionalAttachment,
    ...(Array.isArray(webhookPayload.additionalAttachments) ? webhookPayload.additionalAttachments : []),
  ].filter(isAdditionalAttachment);
  const rawList: Array<{ path: string; name?: string; size?: number; type?: string }> = [];

  for (const attachment of attachments) {
    await getAttachmentUrl(attachment);

    if (typeof attachment.path === 'string') {
      rawList.push({
        path: attachment.path,
        name: attachment.name,
        size: attachment.size,
        type: attachment.type,
      });
    }
  }

  return { rawList };
}

async function getAttachmentUrl(attachment: AdditionalAttachment) {
  if (attachment.path.startsWith('http')) {
    return attachment.path;
  }

  try {
    return getServerFileUrl(attachment.path);
  } catch (error) {
    console.error(`[UPLOAD-QUEUE] Failed to generate web application URL for attachment ${attachment.path}:`, error);
    return getServerFileUrl(attachment.path);
  }
}

async function getServerFileUrl(path: string) {
  const { buildServerFileUrl } = await import('@/lib/fileUrls');
  return buildServerFileUrl(path, { strategy: 'stream' });
}
