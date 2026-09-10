import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  canCreateEvaluationLink,
  canManageEvaluationLink,
  canViewEvaluationLinks,
  type SessionLikeUser,
} from '@/lib/permissions';
import { forbiddenEvaluationLinkResponse } from './applicant-evaluation-link-response';

type EvaluationLinkUser = SessionLikeUser & {
  id: string;
};

export async function requireEvaluationLinkSession() {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

export function requireEvaluationLinkViewPermission(user: EvaluationLinkUser) {
  const { canView, reason } = canViewEvaluationLinks(user);
  return canView ? null : forbiddenEvaluationLinkResponse(reason);
}

export function requireEvaluationLinkCreatePermission(user: EvaluationLinkUser, applicantRecruiterId: string | null | undefined) {
  const { canCreate, reason } = canCreateEvaluationLink(user, applicantRecruiterId, user.id);
  return canCreate ? null : forbiddenEvaluationLinkResponse(reason);
}

export function requireEvaluationLinkManagePermission(
  user: EvaluationLinkUser,
  linkCreatedById: string | null | undefined,
  fallbackReason = 'Insufficient permissions'
) {
  const { canManage, reason } = canManageEvaluationLink(user, linkCreatedById, user.id);
  return canManage ? null : forbiddenEvaluationLinkResponse(reason || fallbackReason);
}
