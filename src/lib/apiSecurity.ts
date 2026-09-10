import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { addSecurityHeaders } from '@/lib/api-security-helpers';
import {
  isBuildUnavailableRequest,
  resolveApiSecurityOptions,
} from '@/lib/api-security-wrapper-utils';
import { runApiSecurityGuards } from '@/lib/api-security-wrapper-guards';

export {
  addSecurityHeaders,
  sanitizeApiResponse,
  validateFileUploadSecurity,
} from '@/lib/api-security-helpers';

/**
 * API Security wrapper for protecting API endpoints
 */

export interface ApiSecurityOptions {
  requireAuth?: boolean;
  requirePermission?: string;
  rateLimit?: boolean;
  validateInput?: boolean;
  logAccess?: boolean;
  allowedMethods?: string[];
}

export type ApiSecurityContext = Record<string, unknown> | undefined;

/**
 * Secure API handler wrapper
 */
export function withApiSecurity(
  handler: (req: NextRequest, context: ApiSecurityContext) => Promise<NextResponse>,
  options: ApiSecurityOptions = {}
) {
  return async (req: NextRequest, context: ApiSecurityContext): Promise<NextResponse> => {
    const securityOptions = resolveApiSecurityOptions(options);

    try {
      if (isBuildUnavailableRequest(req)) {
        return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 });
      }

      const guardResult = await runApiSecurityGuards(req, securityOptions);
      if (!guardResult.ok) {
        return guardResult.response;
      }

      const response = await handler(req, context);
      return addSecurityHeaders(response);

    } catch (error) {
      console.error('[API SECURITY] Error in security wrapper:', error);
      
      await logAudit(
        'ERROR',
        `API security wrapper error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'API:Security',
        null,
        { 
          error: error instanceof Error ? error.stack : String(error),
          url: req.url,
          method: req.method
        }
      );

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

