import type { CommentAttachmentPreview } from './applicant-comments-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeCommentAttachments(value: unknown, applicantId = ''): CommentAttachmentPreview[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map(attachment => createCommentAttachmentPreview(attachment, applicantId));
}

export function createCommentAttachmentPreview(attachment: unknown, applicantId: string): CommentAttachmentPreview {
  const attachmentRecord = isRecord(attachment) ? attachment : {};

  return {
    id: getString(attachmentRecord.id) || undefined,
    fileName: getString(attachmentRecord.fileName),
    url: getString(attachmentRecord.url),
    label: getString(attachmentRecord.label) || undefined,
    updatedAt: getString(attachmentRecord.updatedAt) || undefined,
    fileSize: typeof attachmentRecord.fileSize === 'number' ? attachmentRecord.fileSize : undefined,
    filePath: getString(attachmentRecord.filePath) || undefined,
    applicantId: getString(attachmentRecord.applicantId, applicantId),
  };
}

export function appendCommentFilesWithLabels(
  currentFiles: File[],
  currentLabels: string[],
  nextFiles: File[],
) {
  return {
    files: [...(Array.isArray(currentFiles) ? currentFiles : []), ...nextFiles],
    labels: [...(Array.isArray(currentLabels) ? currentLabels : []), ...nextFiles.map(() => 'other')],
  };
}
