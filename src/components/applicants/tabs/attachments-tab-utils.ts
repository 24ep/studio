import type { FileViewerFile } from '@/components/ui/file-viewer-modal-types';
import type { Attachment } from './attachments-tab-types';

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  pdf: 'application/pdf',
  png: 'image/png',
  txt: 'text/plain',
  webp: 'image/webp',
};

export function getAttachmentFileType(
  fileName: string | null | undefined,
): string {
  if (!fileName) {
    return 'application/octet-stream';
  }

  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

export function buildAttachmentViewerFile(
  attachment: Attachment,
  applicantId: string,
): FileViewerFile {
  return {
    applicantId,
    fileName: attachment.fileName,
    filePath: attachment.filePath,
    label: attachment.label,
    updatedAt: attachment.uploadedAt,
    url: attachment.url || '',
  };
}
