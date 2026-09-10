export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  requireApplicantSourcesRouteSession,
  requireApplicantSourcesWritePermission,
} from '../applicant-sources-route-auth';
import { importApplicantSourcesFromAppKit } from '../applicant-sources-route-data';
import {
  appKitApplicantSourcesImportSchema,
  getApplicantSourcesRouteErrorMessage,
} from '../applicant-sources-route-schema';

export async function POST(request: NextRequest) {
  const sessionResult = await requireApplicantSourcesRouteSession();
  if (!sessionResult.ok) return sessionResult.response;

  const permissionError = requireApplicantSourcesWritePermission(sessionResult.session.user);
  if (permissionError) return permissionError;

  try {
    const bodyResult = await readRequestJsonResult(request);
    const input = appKitApplicantSourcesImportSchema.parse(bodyResult.ok ? bodyResult.value : {});
    const sources = await importApplicantSourcesFromAppKit(input);
    await logAudit('INFO', `Loaded Applicant sources from AppKit (${input.environment})`, 'API:ApplicantSources:ImportAppKit', sessionResult.session.user.id);
    return NextResponse.json({ sources }, { status: 200 });
  } catch (error) {
    const errorMessage = getApplicantSourcesRouteErrorMessage(error);
    console.error('Failed to import Applicant sources from AppKit:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error importing Applicant sources from AppKit', error: errorMessage }, { status: 500 });
  }
}
