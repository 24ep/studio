import type { Attachment } from '@/lib/types';

export interface HeadcountFileViewerFile {
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number;
}

export function formatHeadcountAttachmentFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes) || bytes < 0) {
    return 'Unknown size';
  }

  if (bytes === 0) {
    return '0 Bytes';
  }

  const unitSize = 1024;
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const rawIndex = Math.floor(Math.log(bytes) / Math.log(unitSize));
  const unitIndex = Math.max(0, Math.min(rawIndex, units.length - 1));

  return `${parseFloat((bytes / Math.pow(unitSize, unitIndex)).toFixed(2))} ${units[unitIndex]}`;
}

export function getHeadcountAttachmentIconClassName(fileName: string) {
  if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
    return 'text-primary';
  }

  if (fileName.match(/\.pdf$/i)) {
    return 'text-red-500';
  }

  return 'text-muted-foreground';
}

export function buildHeadcountAttachmentStreamUrl(attachment: Attachment, headcountId?: string) {
  const params = new URLSearchParams({
    filePath: attachment.filePath,
    fileName: attachment.fileName,
    ...(headcountId ? { headcountId } : {}),
  });

  return `/api/secure-file/stream?${params.toString()}`;
}

export function buildHeadcountAttachmentDownloadUrl(attachment: Attachment, headcountId: string) {
  const params = new URLSearchParams({
    filePath: attachment.filePath,
    fileName: attachment.fileName,
    headcountId,
  });

  return `/api/download?${params.toString()}`;
}

export function createSelectedHeadcountFilePreview(file: File): HeadcountFileViewerFile {
  return {
    fileName: file.name,
    url: URL.createObjectURL(file),
    fileSize: file.size,
  };
}

export function createHeadcountAttachmentPreview(attachment: Attachment, headcountId?: string): HeadcountFileViewerFile {
  return {
    fileName: attachment.fileName,
    url: buildHeadcountAttachmentStreamUrl(attachment, headcountId),
    label: attachment.label,
    updatedAt: attachment.uploadedAt,
    fileSize: undefined,
  };
}
