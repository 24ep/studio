import {
  buildAttachmentDownloadHttpErrorMessage,
} from './attachments-route-download-errors';
import { tryDownloadSecureFileFromMinio } from './attachments-route-minio-download';
import {
  extractAttachmentFileName,
  getCaseInsensitiveHeader,
  inferAttachmentContentType,
  isAllowedAttachmentDownloadDomain,
  isBlockedAttachmentDownloadHost,
} from './attachments-route-pure-utils';

export {
  extractAttachmentFileName,
  getCaseInsensitiveHeader,
  inferAttachmentContentType,
  isAllowedAttachmentDownloadDomain,
  isBlockedAttachmentDownloadHost,
};

export interface DownloadedAttachmentFile {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}

export async function downloadFileFromUrl(
  url: string,
  headers?: Record<string, string>
): Promise<DownloadedAttachmentFile> {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (isBlockedAttachmentDownloadHost(hostname)) {
      console.error('[SECURITY] Blocked SSRF attempt to internal/private host:', hostname);
      throw new Error('Invalid URL: Access to internal or private networks is not allowed');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      console.error('[SECURITY] Blocked SSRF attempt with invalid protocol:', parsedUrl.protocol);
      throw new Error('Invalid URL: Only HTTP and HTTPS protocols are allowed');
    }

    const allowedDomains = process.env.ALLOWED_DOWNLOAD_DOMAINS?.split(',').map(d => d.trim()).filter(Boolean) || [];
    const currentOrigin = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname.toLowerCase() : '';
    if (!isAllowedAttachmentDownloadDomain(hostname, currentOrigin, allowedDomains)) {
      console.error('[SECURITY] Blocked SSRF attempt to unauthorized domain:', hostname);
      throw new Error('Invalid URL: Domain not in allowed list');
    }

    const minioDownload = await tryDownloadSecureFileFromMinio({
      parsedUrl,
      currentOrigin,
    });
    if (minioDownload) {
      return minioDownload;
    }

    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Studio-Attachment-Downloader/1.0',
      ...headers,
    };
    const urlHost = parsedUrl.hostname;
    const currentHost = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'unknown';
    const isDifferentEnvironment = urlHost !== currentHost;
    const isSecureFileUrl = parsedUrl.pathname.includes('/api/secure-file/stream');

    const response = await fetch(url, { headers: fetchHeaders });

    if (!response.ok) {
      const hasCookie = Boolean(getCaseInsensitiveHeader(headers, 'cookie'));
      const authHeader = getCaseInsensitiveHeader(headers, 'authorization');
      const errorMessage = buildAttachmentDownloadHttpErrorMessage({
        status: response.status,
        statusText: response.statusText,
        context: {
          url,
          urlHost,
          currentHost,
          isDifferentEnvironment,
          isSecureFileUrl,
          hasCookie,
          hasAuthorization: Boolean(authHeader),
          authPreview: authHeader ? (authHeader.length > 20 ? `${authHeader.substring(0, 20)}...` : authHeader) : 'not provided',
        },
      });

      if (response.status === 403) {
        console.error(`[ATTACHMENTS] 403 Error details - URL: ${url.substring(0, 100)}..., Host: ${urlHost}, Current: ${currentHost}, Secure-file: ${isSecureFileUrl}, Different env: ${isDifferentEnvironment}, Has cookie: ${hasCookie}`);
      }

      throw new Error(errorMessage);
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      fileName: extractAttachmentFileName(parsedUrl, response),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to download file:')) {
      throw error;
    }
    throw new Error(`Failed to download file from URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}
