import { NextResponse, type NextRequest } from 'next/server';
import {
  requireEvaluationLinkCreatePermission,
  requireEvaluationLinkManagePermission,
  requireEvaluationLinkSession,
  requireEvaluationLinkViewPermission,
} from './applicant-evaluation-link-auth';
import {
  createEvaluationLink,
  fetchActiveEvaluationLink,
  fetchActiveEvaluationLinkByToken,
  fetchEvaluationLinkApplicant,
  revokeEvaluationLink,
  saveEvaluationLinkInterviewDetails,
  updateEvaluationLink,
} from './applicant-evaluation-link-data';
import {
  parseCreateEvaluationLinkBody,
  parseUpdateEvaluationLinkBody,
  resolveEvaluationLinkApplicantId,
} from './applicant-evaluation-link-request';
import {
  evaluationLinkErrorResponse,
  serializeEvaluationLink,
} from './applicant-evaluation-link-response';
import type { ApplicantEvaluationLinkRouteContext } from './applicant-evaluation-link-schema';

export async function handleGetApplicantEvaluationLink(request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  try {
    const applicantId = await resolveEvaluationLinkApplicantId(context);
    const token = request.nextUrl.searchParams.get('token');

    const applicant = await fetchEvaluationLinkApplicant(applicantId);
    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    if (token) {
      const link = await fetchActiveEvaluationLinkByToken(applicantId, token);
      return link
        ? NextResponse.json(serializeEvaluationLink(link, applicantId))
        : NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const session = await requireEvaluationLinkSession();
    if (!session.ok) {
      return session.response;
    }

    const permissionError = requireEvaluationLinkViewPermission(session.session.user);
    if (permissionError) {
      return permissionError;
    }

    const link = await fetchActiveEvaluationLink(applicantId);
    return link
      ? NextResponse.json(serializeEvaluationLink(link, applicantId, { includeCreatedBy: true }))
      : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return evaluationLinkErrorResponse(error);
  }
}

export async function handleCreateApplicantEvaluationLink(request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  try {
    const session = await requireEvaluationLinkSession();
    if (!session.ok) {
      return session.response;
    }

    const applicantId = await resolveEvaluationLinkApplicantId(context);
    const input = await parseCreateEvaluationLinkBody(request);
    const applicant = await fetchEvaluationLinkApplicant(applicantId);
    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    const permissionError = requireEvaluationLinkCreatePermission(session.session.user, applicant.recruiterId);
    if (permissionError) {
      return permissionError;
    }

    await saveEvaluationLinkInterviewDetails(applicantId, applicant, input);
    const existing = await fetchActiveEvaluationLink(applicantId);
    if (existing && !input.force) {
      return NextResponse.json(
        serializeEvaluationLink(existing, applicantId, {
          includeCreatedBy: true,
          includeRequireLogin: false,
          existing: true,
        }),
        { status: 200 }
      );
    }

    if (existing && input.force) {
      const manageError = requireEvaluationLinkManagePermission(
        session.session.user,
        existing.createdById,
        'Insufficient permissions to revoke existing link'
      );
      if (manageError) {
        return manageError;
      }
      await revokeEvaluationLink(existing.id);
    }

    const created = await createEvaluationLink(applicantId, session.session.user.id, input.days, input.requireLogin);
    return NextResponse.json(
      serializeEvaluationLink(created, applicantId, { includeCreatedBy: true }),
      { status: 201 }
    );
  } catch (error) {
    return evaluationLinkErrorResponse(error);
  }
}

export async function handleRevokeApplicantEvaluationLink(_request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  try {
    const session = await requireEvaluationLinkSession();
    if (!session.ok) {
      return session.response;
    }

    const applicantId = await resolveEvaluationLinkApplicantId(context);
    const link = await fetchActiveEvaluationLink(applicantId);
    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const permissionError = requireEvaluationLinkManagePermission(session.session.user, link.createdById);
    if (permissionError) {
      return permissionError;
    }

    await revokeEvaluationLink(link.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return evaluationLinkErrorResponse(error);
  }
}

export async function handleUpdateApplicantEvaluationLink(request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  try {
    const session = await requireEvaluationLinkSession();
    if (!session.ok) {
      return session.response;
    }

    const applicantId = await resolveEvaluationLinkApplicantId(context);
    const input = await parseUpdateEvaluationLinkBody(request);
    const days = typeof input.days === 'number' && input.days > 0 ? input.days : undefined;
    const link = await fetchActiveEvaluationLink(applicantId);
    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const permissionError = requireEvaluationLinkManagePermission(session.session.user, link.createdById);
    if (permissionError) {
      return permissionError;
    }

    const updated = await updateEvaluationLink(link, { days, requireLogin: input.requireLogin });
    return NextResponse.json(serializeEvaluationLink(updated, applicantId, { includeCreatedBy: true }));
  } catch (error) {
    return evaluationLinkErrorResponse(error);
  }
}
