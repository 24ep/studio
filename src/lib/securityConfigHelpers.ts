interface SecurityHeaderConfig {
  contentSecurityPolicy: Record<string, string[]>;
  permissionsPolicy: Record<string, string[]>;
}

interface FileUploadConfig {
  allowedExtensions: string[];
  allowedTypes: string[];
}

interface RateLimitConfig {
  api: unknown;
  auth: unknown;
  search: unknown;
  upload: unknown;
}

export function buildSecurityHeader(
  headers: SecurityHeaderConfig,
  name: string,
): string | undefined {
  switch (name) {
    case "Content-Security-Policy":
      return Object.entries(headers.contentSecurityPolicy)
        .map(([key, values]) => `${key} ${values.join(" ")}`)
        .join("; ");

    case "Permissions-Policy":
      return Object.entries(headers.permissionsPolicy)
        .map(([key, values]) => `${key}=(${values.join(" ")})`)
        .join(", ");

    default:
      return undefined;
  }
}

export function isAllowedConfiguredFileType(
  fileUpload: FileUploadConfig,
  mimetype: string,
  filename: string,
): boolean {
  if (!fileUpload.allowedTypes.includes(mimetype)) {
    return false;
  }

  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return fileUpload.allowedExtensions.includes(extension);
}

export function isBlockedConfiguredPattern(blockedPatterns: RegExp[], input: string): boolean {
  return blockedPatterns.some(pattern => pattern.test(input));
}

export function getConfiguredRateLimit(endpoint: string, rateLimits: RateLimitConfig) {
  if (endpoint.includes("/auth/") || endpoint.includes("/signin")) {
    return rateLimits.auth;
  }

  if (endpoint.includes("/upload") || endpoint.includes("/file")) {
    return rateLimits.upload;
  }

  if (endpoint.includes("/search") || endpoint.includes("/applicants")) {
    return rateLimits.search;
  }

  return rateLimits.api;
}
