const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB'] as const;
const BYTES_PER_UNIT = 1024;

/**
 * Format file size from bytes to human readable string
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!isValidFileSize(bytes)) {
    return 'Unknown size';
  }

  if (bytes === 0) return '0 Bytes';

  const sizeIndex = getFileSizeUnitIndex(bytes);
  return `${formatRoundedNumber(bytes / Math.pow(BYTES_PER_UNIT, sizeIndex))} ${FILE_SIZE_UNITS[sizeIndex]}`;
}

function isValidFileSize(bytes: number | null | undefined): bytes is number {
  return typeof bytes === 'number' && Number.isFinite(bytes) && bytes >= 0;
}

function getFileSizeUnitIndex(bytes: number) {
  const rawIndex = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT));
  return Math.max(0, Math.min(rawIndex, FILE_SIZE_UNITS.length - 1));
}

function formatRoundedNumber(value: number) {
  return parseFloat(value.toFixed(2));
}
