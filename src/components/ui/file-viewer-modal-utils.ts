import { convertMinIOUrlToSecureUrl } from '../../lib/imageUtils';
import { sanitizeUrl } from '../../lib/security';
import type { FileViewerFile } from './file-viewer-modal-types';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']);
const PREVIEW_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, 'pdf']);
const FILE_TYPE_BY_EXTENSION: Record<string, string> = {
  bmp: 'Image',
  doc: 'Word Document',
  docx: 'Word Document',
  gif: 'Image',
  jpeg: 'Image',
  jpg: 'Image',
  pdf: 'PDF Document',
  png: 'Image',
  rtf: 'Rich Text Format',
  webp: 'Image',
  xls: 'Excel Spreadsheet',
  xlsx: 'Excel Spreadsheet',
};

export function canPreviewFile(fileName: string): boolean {
  return PREVIEW_EXTENSIONS.has(getFileExtension(fileName));
}

export function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(fileName));
}

export function isPdfFile(fileName: string): boolean {
  return getFileExtension(fileName) === 'pdf';
}

export function getFileType(fileName: string): string {
  return FILE_TYPE_BY_EXTENSION[getFileExtension(fileName)] || 'Document';
}

export function formatFileSize(bytes?: number | string): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) || 0 : bytes;

  if (size === undefined || size === null || size === 0) return 'Unknown size';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildFilePreviewUrl(file: FileViewerFile): string {
  if (file.filePath) {
    const params = new URLSearchParams({ filePath: file.filePath });
    if (file.fileName) params.set('fileName', file.fileName);
    if (file.applicantId) params.set('applicantId', file.applicantId);
    if (file.headcountId) params.set('headcountId', file.headcountId);
    return `/api/secure-file/preview?${params.toString()}`;
  }

  if (file.url.includes('/api/secure-file/stream')) {
    return file.url.replace('/api/secure-file/stream', '/api/secure-file/preview');
  }
  if (file.url.includes('/api/secure-file/preview')) {
    return file.url;
  }
  return convertMinIOUrlToSecureUrl(file.url) || file.url;
}

export function getSafeFileOpenUrl(file: FileViewerFile | null, previewUrl: string): string | null {
  if (previewUrl) {
    return normalizeSafeUrl(sanitizeUrl(previewUrl));
  }
  if (!file?.url) {
    return null;
  }
  const fallbackUrl = file.url.includes('/api/secure-file/stream')
    ? file.url.replace('/api/secure-file/stream', '/api/secure-file/preview')
    : file.url;
  return normalizeSafeUrl(sanitizeUrl(fallbackUrl));
}

function normalizeSafeUrl(url: string): string | null {
  return url || null;
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function getLegacyOperaUserAgent(): string {
  const windowWithOpera = window as Window & { opera?: unknown };
  return typeof windowWithOpera.opera === 'string' ? windowWithOpera.opera : '';
}
