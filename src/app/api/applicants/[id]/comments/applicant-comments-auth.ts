import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPool, type DbClient } from '@/lib/db';
import { canAddComments, type SessionLikeUser } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';

type ApplicantCommentsUser = SessionLikeUser & {
  id: string;
  name?: string | null;
  email?: string | null;
};

type ApplicantRecruiterRow = {
  recruiterId: string | null;
};

export async function requireApplicantCommentsSession() {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export function getApplicantCommentViewAccess(user: ApplicantCommentsUser) {
  const userPerms = user.modulePermissions || [];
  const canViewAll = user.role === 'Admin' || userPerms.includes('APPLICANTS_COMMENTS_VIEW');
  const canViewRemarks = userPerms.includes('APPLICANTS_COMMENTS_VIEW_REMARK_ONLY');

  return { canViewAll, canViewRemarks };
}

export function getApplicantCommentPostTypeError(user: ApplicantCommentsUser, type: string) {
  const { canViewAll, canViewRemarks } = getApplicantCommentViewAccess(user);

  if (canViewAll) return null;
  if (canViewRemarks && type !== 'remark') {
    return 'Forbidden: You can only post Remarks to HM';
  }
  if (!canViewRemarks) {
    return 'Forbidden: No permission to add comments';
  }

  return null;
}

export async function requireCanAddApplicantComment(applicantId: string, user: ApplicantCommentsUser) {
  const client: DbClient = await getPool().connect();

  try {
    const applicantResult = await client.query<ApplicantRecruiterRow>(
      'SELECT "recruiterId" FROM "Applicant" WHERE id = $1',
      [applicantId]
    );
    if (applicantResult.rows.length === 0) {
      return {
        ok: false as const,
        response: NextResponse.json({ message: 'Applicant not found' }, { status: 404 }),
      };
    }

    const applicant = applicantResult.rows[0];
    const commentPermission = canAddComments(user, applicant.recruiterId, user.id);
    if (!commentPermission.canAdd) {
      await logAudit(
        'WARN',
        `Forbidden attempt to add comment by ${user.name || user.email}: ${commentPermission.reason}`,
        'API:Applicants:Comments:Add',
        user.id
      );
      return {
        ok: false as const,
        response: NextResponse.json({ message: `Forbidden: ${commentPermission.reason}` }, { status: 403 }),
      };
    }

    return { ok: true as const };
  } catch (error) {
    console.error('Error checking Applicant ownership for comments:', error);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    };
  } finally {
    client.release();
  }
}
