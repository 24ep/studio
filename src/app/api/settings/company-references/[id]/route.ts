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
import {
  companyReferenceNameExists,
  deleteCompanyReference,
  updateCompanyReference,
} from '../company-references-route-data';
import {
  companyReferenceInputSchema,
  getCompanyReferencesRouteErrorMessage,
} from '../company-references-route-schema';

type CompanyReferenceDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: CompanyReferenceDetailRouteContext) {
  const sessionResult = await requireCompanyReferencesRouteSession();
  if (!sessionResult.ok) return sessionResult.response;

  const permissionError = requireCompanyReferencesWritePermission(sessionResult.session.user);
  if (permissionError) return permissionError;

  const { id } = await context.params;

  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const input = companyReferenceInputSchema.parse(bodyResult.value);
    if (await companyReferenceNameExists(input.name, id)) {
      return NextResponse.json({ message: 'A company reference with this name already exists' }, { status: 409 });
    }

    const company = await updateCompanyReference(id, input);
    if (!company) {
      return NextResponse.json({ message: 'Company reference not found' }, { status: 404 });
    }

    await logAudit('INFO', `Updated company reference: ${input.name}`, 'API:CompanyReferences:Update', sessionResult.session.user.id);
    return NextResponse.json(company, { status: 200 });
  } catch (error) {
    const errorMessage = getCompanyReferencesRouteErrorMessage(error);
    console.error('Failed to update company reference:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error updating company reference', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: CompanyReferenceDetailRouteContext) {
  void request;
  const sessionResult = await requireCompanyReferencesRouteSession();
  if (!sessionResult.ok) return sessionResult.response;

  const permissionError = requireCompanyReferencesWritePermission(sessionResult.session.user);
  if (permissionError) return permissionError;

  const { id } = await context.params;

  try {
    const deleted = await deleteCompanyReference(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Company reference not found' }, { status: 404 });
    }

    await logAudit('INFO', `Deleted company reference: ${id}`, 'API:CompanyReferences:Delete', sessionResult.session.user.id);
    return NextResponse.json({ message: 'Company reference deleted' }, { status: 200 });
  } catch (error) {
    const errorMessage = getCompanyReferencesRouteErrorMessage(error);
    console.error('Failed to delete company reference:', error);
    return NextResponse.json({ message: 'Error deleting company reference', error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  void request;
  return NextResponse.json({ message: 'Use the company reference list endpoint' }, { status: 405 });
}
