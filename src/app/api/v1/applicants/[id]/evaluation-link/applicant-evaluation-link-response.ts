import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildEvaluateUrl } from './applicant-evaluation-link-url';

export type EvaluationLinkResponseOptions = {
  includeCreatedBy?: boolean;
  includeRequireLogin?: boolean;
  existing?: boolean;
};

export function serializeEvaluationLink(
  link: {
    id: string;
    token: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    requireLogin: boolean;
    createdBy?: unknown;
  },
  applicantId: string,
  options: EvaluationLinkResponseOptions = {}
) {
  return {
    id: link.id,
    token: link.token,
    url: buildEvaluateUrl(applicantId, link.token),
    expiresAt: link.expiresAt,
    revokedAt: link.revokedAt,
    createdAt: link.createdAt,
    ...(options.includeCreatedBy ? { createdBy: link.createdBy } : {}),
    ...(options.includeRequireLogin !== false ? { requireLogin: link.requireLogin } : {}),
    ...(options.existing ? { existing: true } : {}),
  };
}

export function evaluationLinkErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Internal Server Error';
  const hint = typeof message === 'string' && message.toLowerCase().includes('relation')
    ? 'Database table missing. Run migrations.'
    : undefined;
  return NextResponse.json({ error: 'Internal Server Error', message, hint }, { status: 500 });
}

export function forbiddenEvaluationLinkResponse(reason?: string) {
  return NextResponse.json(
    { error: 'Forbidden', message: reason || 'Insufficient permissions' },
    { status: 403 }
  );
}
