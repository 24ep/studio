import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  requireApplicantSourceDetailSession,
  requireApplicantSourceWritePermission,
} from './applicant-source-detail-auth';
import {
  applicantSourceNameExistsForOtherSource,
  countApplicantsUsingSource,
  deleteApplicantSource,
  fetchApplicantSourceById,
  fetchApplicantSourceIdentity,
  updateApplicantSource,
} from './applicant-source-detail-data';
import {
  type ApplicantSourceDetailRouteContext,
  updateApplicantSourceSchema,
} from './applicant-source-detail-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleGetApplicantSourceDetail(
  _request: NextRequest,
  context: ApplicantSourceDetailRouteContext
) {
  const sessionResult = await requireApplicantSourceDetailSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  try {
    const { id } = await context.params;
    const source = await fetchApplicantSourceById(id);
    if (!source) {
      return NextResponse.json({ message: 'Applicant source not found' }, { status: 404 });
    }

    return NextResponse.json(source, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to fetch Applicant source:', error);
    await logAudit(
      'ERROR',
      `Failed to fetch Applicant source. Error: ${errorMessage}`,
      'API:ApplicantSources:GetById',
      sessionResult.session.user.id
    );
    return NextResponse.json({ message: 'Error fetching Applicant source', error: errorMessage }, { status: 500 });
  }
}

export async function handleUpdateApplicantSourceDetail(
  request: NextRequest,
  context: ApplicantSourceDetailRouteContext
) {
  const sessionResult = await requireApplicantSourceDetailSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const permissionError = requireApplicantSourceWritePermission(sessionResult.session.user);
  if (permissionError) {
    return permissionError;
  }

  try {
    const { id } = await context.params;
    const bodyResult = await readRequestJsonResult(request);
    const input = updateApplicantSourceSchema.parse(bodyResult.ok ? bodyResult.value : undefined);

    const existingSource = await fetchApplicantSourceIdentity(id);
    if (!existingSource) {
      return NextResponse.json({ message: 'Applicant source not found' }, { status: 404 });
    }

    if (input.name && input.name !== existingSource.name && await applicantSourceNameExistsForOtherSource(input.name, id)) {
      return NextResponse.json({ message: 'A Applicant source with this name already exists' }, { status: 409 });
    }

    const updatedSource = await updateApplicantSource(id, input);
    if (!updatedSource) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    await logAudit(
      'INFO',
      `Updated Applicant source: ${updatedSource.name}`,
      'API:ApplicantSources:Update',
      sessionResult.session.user.id
    );

    return NextResponse.json(updatedSource, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to update Applicant source:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }

    await logAudit(
      'ERROR',
      `Failed to update Applicant source. Error: ${errorMessage}`,
      'API:ApplicantSources:Update',
      sessionResult.session.user.id
    );
    return NextResponse.json({ message: 'Error updating Applicant source', error: errorMessage }, { status: 500 });
  }
}

export async function handleDeleteApplicantSourceDetail(
  _request: NextRequest,
  context: ApplicantSourceDetailRouteContext
) {
  const sessionResult = await requireApplicantSourceDetailSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const permissionError = requireApplicantSourceWritePermission(sessionResult.session.user);
  if (permissionError) {
    return permissionError;
  }

  try {
    const { id } = await context.params;
    const existingSource = await fetchApplicantSourceIdentity(id);
    if (!existingSource) {
      return NextResponse.json({ message: 'Applicant source not found' }, { status: 404 });
    }

    if (await countApplicantsUsingSource(id) > 0) {
      return NextResponse.json(
        {
          message: 'Cannot delete Applicant source that is being used by applicants. Please reassign or remove the source from applicants first.',
        },
        { status: 400 }
      );
    }

    await deleteApplicantSource(id);
    await logAudit(
      'INFO',
      `Deleted Applicant source: ${existingSource.name}`,
      'API:ApplicantSources:Delete',
      sessionResult.session.user.id
    );

    return NextResponse.json({ message: 'Applicant source deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to delete Applicant source:', error);
    await logAudit(
      'ERROR',
      `Failed to delete Applicant source. Error: ${errorMessage}`,
      'API:ApplicantSources:Delete',
      sessionResult.session.user.id
    );
    return NextResponse.json({ message: 'Error deleting Applicant source', error: errorMessage }, { status: 500 });
  }
}
