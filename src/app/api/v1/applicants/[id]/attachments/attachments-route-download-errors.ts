export interface AttachmentDownloadErrorContext {
  url: string;
  urlHost: string;
  currentHost: string;
  isDifferentEnvironment: boolean;
  isSecureFileUrl: boolean;
  hasCookie: boolean;
  hasAuthorization: boolean;
  authPreview: string;
}

export function buildAttachmentDownloadHttpErrorMessage({
  status,
  statusText,
  context,
}: {
  status: number;
  statusText: string;
  context: AttachmentDownloadErrorContext;
}) {
  if (status === 401) {
    return buildUnauthorizedAttachmentDownloadMessage(status, statusText, context);
  }

  if (status === 403) {
    return buildForbiddenAttachmentDownloadMessage(status, statusText, context);
  }

  if (status === 404) {
    return `Failed to download file: ${status} ${statusText}. The file was not found at the provided URL.`;
  }

  return `Failed to download file: ${status} ${statusText}`;
}

function buildUnauthorizedAttachmentDownloadMessage(
  status: number,
  statusText: string,
  context: AttachmentDownloadErrorContext,
) {
  if (context.isSecureFileUrl) {
    if (!context.hasCookie) {
      return `Failed to download file: ${status} ${statusText}. The secure-file/stream endpoint requires session-based authentication (cookies). Please provide a 'Cookie' header in the request body's 'headers' object. Example: { "headers": { "Cookie": "next-auth.session-token=your-session-token" } }. Bearer tokens are not supported for this endpoint.`;
    }

    return `Failed to download file: ${status} ${statusText}. The secure-file/stream endpoint returned 401 even with cookies provided. The cookie may be expired, invalid, or from a different session. Please verify: (1) the cookie is from the same environment as the URL, (2) the cookie is not expired, (3) the session is still valid.`;
  }

  if (!context.hasAuthorization) {
    return `Failed to download file: ${status} ${statusText}. The URL requires authentication. Please provide authentication headers in the request body (use 'headers' object or 'authToken' field).`;
  }

  return `Failed to download file: ${status} ${statusText}. The provided authentication credentials are invalid or expired. Please verify that the Authorization token in the 'headers' object is valid and not expired. Token preview: ${context.authPreview}. If using a time-limited token, ensure it's refreshed before making the request.`;
}

function buildForbiddenAttachmentDownloadMessage(
  status: number,
  statusText: string,
  context: AttachmentDownloadErrorContext,
) {
  let errorMessage = `Failed to download file: ${status} ${statusText}. Access forbidden`;

  if (context.isSecureFileUrl && context.isDifferentEnvironment) {
    errorMessage += context.hasCookie
      ? ` - The secure-file/stream endpoint from ${context.urlHost} returned 403 even with cookies provided. The cookie may be expired, invalid, or from a different session. Please verify: (1) the cookie is from the same environment (${context.urlHost}), (2) the cookie is not expired, (3) the session has the required permissions. Alternatively, ensure the file exists in both MinIO instances for direct access.`
      : ` - The secure-file/stream endpoint from ${context.urlHost} only supports session-based authentication (cookies), not Bearer tokens. Please provide a 'Cookie' header in the request body's 'headers' object with a valid session cookie (e.g., "Cookie": "next-auth.session-token=..."). Cross-environment file access requires either: (1) the file to exist in both MinIO instances, (2) using cookies for authentication, or (3) using a direct file URL that supports Bearer token authentication.`;
  } else if (context.isSecureFileUrl) {
    errorMessage += context.hasCookie
      ? ` - The secure-file/stream endpoint returned 403 even with cookies. The cookie may be expired or invalid, or the session may lack required permissions. The file may also not exist in the storage system.`
      : ` - The secure-file/stream endpoint requires session-based authentication (cookies), not Bearer tokens. Please provide a 'Cookie' header. If this is from a different environment (${context.urlHost}), the file must exist in both MinIO instances, or you need to use cookies for authentication.`;
  } else if (context.isDifferentEnvironment) {
    errorMessage += ` - The URL is from a different environment (${context.urlHost}) and the provided authentication token may not have access to this file, or the token may be expired. Please ensure the token is valid and has the necessary permissions for the target environment.`;
  } else {
    errorMessage += ` - The URL may require different permissions or the file may not be accessible.`;
  }

  return errorMessage;
}
