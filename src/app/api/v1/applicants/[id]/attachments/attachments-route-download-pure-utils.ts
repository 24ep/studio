const BLOCKED_ATTACHMENT_DOWNLOAD_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  '169.254.169.254',
  'metadata.google.internal',
]);

const BLOCKED_ATTACHMENT_DOWNLOAD_HOST_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

export function isBlockedAttachmentDownloadHost(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();

  return BLOCKED_ATTACHMENT_DOWNLOAD_HOSTS.has(normalizedHostname) ||
    BLOCKED_ATTACHMENT_DOWNLOAD_HOST_PATTERNS.some((pattern) => pattern.test(normalizedHostname));
}

export function isAllowedAttachmentDownloadDomain(hostname: string, currentOrigin: string, allowedDomains: string[]) {
  const normalizedHostname = hostname.toLowerCase();
  const isSameOrigin = normalizedHostname === currentOrigin || normalizedHostname.endsWith(`.${currentOrigin}`);
  const isAllowedDomain = allowedDomains.some(domain => normalizedHostname === domain || normalizedHostname.endsWith(`.${domain}`));

  if (allowedDomains.length > 0) {
    return isSameOrigin || isAllowedDomain;
  }

  return isSameOrigin;
}

export function getCaseInsensitiveHeader(headers: Record<string, string> | undefined, headerName: string) {
  if (!headers) return undefined;
  return Object.entries(headers).find(([key]) => key.toLowerCase() === headerName.toLowerCase())?.[1];
}

export function isValidAttachmentFileUrl(fileUrl: string) {
  try {
    new URL(fileUrl);
    return true;
  } catch {
    return false;
  }
}
