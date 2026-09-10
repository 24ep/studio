export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  requireCompanyReferencesRouteSession,
  requireCompanyReferencesViewPermission,
  requireCompanyReferencesWritePermission,
} from './company-references-route-auth';
import {
  companyReferenceNameExists,
  createCompanyReference,
  fetchCompanyReferences,
} from './company-references-route-data';
import {
  companyReferenceInputSchema,
  getCompanyReferencesRouteErrorMessage,
} from './company-references-route-schema';

export async function GET(request: NextRequest) {
  void request;
  const sessionResult = await requireCompanyReferencesRouteSession();
  if (!sessionResult.ok) return sessionResult.response;

  const permissionError = requireCompanyReferencesViewPermission(sessionResult.session.user);
  if (permissionError) return permissionError;

  try {
    return NextResponse.json(await fetchCompanyReferences(), { status: 200 });
  } catch (error) {
    const errorMessage = getCompanyReferencesRouteErrorMessage(error);
    console.error('Failed to fetch company references:', error);
    await logAudit('ERROR', `Failed to fetch company references. Error: ${errorMessage}`, 'API:CompanyReferences:GetAll', sessionResult.session.user.id);
    return NextResponse.json({ message: 'Error fetching company references', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionResult = await requireCompanyReferencesRouteSession();
  if (!sessionResult.ok) return sessionResult.response;

  const permissionError = requireCompanyReferencesWritePermission(sessionResult.session.user);
  if (permissionError) return permissionError;

  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const input = companyReferenceInputSchema.parse(bodyResult.value);
    if (await companyReferenceNameExists(input.name)) {
      return NextResponse.json({ message: 'A company reference with this name already exists' }, { status: 409 });
    }

    const company = await createCompanyReference(input);
    await logAudit('INFO', `Created company reference: ${input.name}`, 'API:CompanyReferences:Create', sessionResult.session.user.id);
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    const errorMessage = getCompanyReferencesRouteErrorMessage(error);
    console.error('Failed to create company reference:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    await logAudit('ERROR', `Failed to create company reference. Error: ${errorMessage}`, 'API:CompanyReferences:Create', sessionResult.session.user.id);
    return NextResponse.json({ message: 'Error creating company reference', error: errorMessage }, { status: 500 });
  }
}
