import {
  getApplicantAttachmentUpdatedAt,
  type ApplicantAttachment,
} from './applicant-attachment-utils';

export interface ApplicantResumeViewerFile {
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number;
  filePath?: string;
  applicantId?: string;
}

export function isImageAttachment(fileName: string) {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
}

export function isPdfAttachment(fileName: string) {
  return /\.pdf$/i.test(fileName);
}

export function buildApplicantAttachmentPreviewUrl(url: string): string {
  if (url.includes('/api/secure-file/stream')) {
    return url.replace('/api/secure-file/stream', '/api/secure-file/preview');
  }

  return url;
}

export function getApplicantAttachmentSortTime(attachment: ApplicantAttachment) {
  const parsedDate = new Date(getApplicantAttachmentUpdatedAt(attachment));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getTime();
}

export function sortApplicantAttachmentsByDate(
  attachments: ApplicantAttachment[] | null | undefined,
  sortDesc: boolean
) {
  return Array.isArray(attachments)
    ? [...attachments].sort((a, b) => {
        const dateA = getApplicantAttachmentSortTime(a);
        const dateB = getApplicantAttachmentSortTime(b);

        if (dateA === null || dateB === null) {
          return 0;
        }

        return sortDesc ? dateB - dateA : dateA - dateB;
      })
    : [];
}

export function buildApplicantResumeViewerFile(
  attachment: ApplicantAttachment,
  fallbackApplicantId: string
): ApplicantResumeViewerFile {
  return {
    fileName: attachment.fileName,
    url: attachment.url,
    label: attachment.label,
    updatedAt: getApplicantAttachmentUpdatedAt(attachment),
    fileSize: attachment.fileSize,
    filePath: attachment.filePath,
    applicantId: attachment.applicantId || fallbackApplicantId,
  };
}

export function getApplicantResumeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
