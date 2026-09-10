import { NextRequest, NextResponse } from 'next/server';

import { securityConfig } from './securityConfig';

type LegacyConnectionRequest = NextRequest & {
  connection?: {
    remoteAddress?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) return forwarded.split(',')[0].trim();

  const connection = (req as LegacyConnectionRequest).connection;
  if (connection?.remoteAddress) {
    return connection.remoteAddress;
  }

  return 'unknown';
}

export async function validateFileUploadSecurity(
  req: NextRequest,
  file: { name: string; type: string; size: number }
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (file.size > securityConfig.fileUpload.maxSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${securityConfig.fileUpload.maxSize / (1024 * 1024)}MB`,
      };
    }

    if (!securityConfig.fileUpload.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed',
      };
    }

    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!securityConfig.fileUpload.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'File extension not allowed',
      };
    }

    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return {
        valid: false,
        error: 'Invalid filename',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('[FILE UPLOAD SECURITY] Error:', error);
    return {
      valid: false,
      error: 'File validation error',
    };
  }
}

export function sanitizeApiResponse(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.replace(/[<>]/g, '');
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeApiResponse(item));
  }

  if (isRecord(data)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (securityConfig.audit.sensitiveFields.some(field =>
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeApiResponse(value);
      }
    }
    return sanitized;
  }

  return data;
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  if (securityConfig.environment.isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}
