export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  requireCompanyReferencesRouteSession,
  requireCompanyReferencesWritePermission,
} from '../company-references-route-auth';
import { importCompanyReferenceFromAppKit } from '../company-references-route-data';
import {
  appKitImportSchema,
  getCompanyReferencesRouteErrorMessage,
} from '../company-references-route-schema';

export async function POST(request: NextRequest) {
  const sessionResult = await requireCompanyReferencesRouteSession();
  if (!sessionResult.ok) return sessionResult.response;

  const permissionError = requireCompanyReferencesWritePermission(sessionResult.session.user);
  if (permissionError) return permissionError;

  try {
    const bodyResult = await readRequestJsonResult(request);
    const input = appKitImportSchema.parse(bodyResult.ok ? bodyResult.value : {});
    const result = await importCompanyReferenceFromAppKit(input);
    await logAudit('INFO', `Synchronized ${result.total} company references from AppKit (${input.environment}): ${result.created} created, ${result.updated} updated`, 'API:CompanyReferences:ImportAppKit', sessionResult.session.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = getCompanyReferencesRouteErrorMessage(error);
    console.error('Failed to import company reference from AppKit:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error importing company reference from AppKit', error: errorMessage }, { status: 500 });
  }
}
