import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

type ApplicantLogsUser = {
  modulePermissions?: string[] | null;
  role?: string | null;
} | null | undefined;

const uuidSchema = z.string().uuid();

export function parseApplicantLogsPagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    limit: parseInt(searchParams.get('limit') || '10', 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
  };
}

export function isValidApplicantLogsApplicantId(applicantId: string) {
  return uuidSchema.safeParse(applicantId).success;
}

export function getApplicantLogsAuthFailureResponse(user: ApplicantLogsUser) {
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userPerms = user.modulePermissions || [];
  const isAdmin = user.role === 'Admin';
  if (!isAdmin && !userPerms.includes('APPLICANTS_ACTIVITIES_VIEW')) {
    return NextResponse.json({ message: 'Forbidden: No permission to view activities' }, { status: 403 });
  }

  return null;
}

export function getInvalidApplicantLogsIdResponse() {
  return NextResponse.json({ message: 'Invalid Applicant ID format' }, { status: 400 });
}
