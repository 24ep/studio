export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { fetchApplicantActivityLogs } from './applicant-logs-data';
import { getApplicantActivityLogsPage } from './applicant-logs-format-utils';
import {
  getApplicantLogsAuthFailureResponse,
  getInvalidApplicantLogsIdResponse,
  isValidApplicantLogsApplicantId,
  parseApplicantLogsPagination,
} from './applicant-logs-request-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const authFailure = getApplicantLogsAuthFailureResponse(session?.user);
  if (authFailure) return authFailure;

  try {
    if (!isValidApplicantLogsApplicantId(id)) {
      return getInvalidApplicantLogsIdResponse();
    }

    const logs = await fetchApplicantActivityLogs(id);
    if (!logs) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    return NextResponse.json(getApplicantActivityLogsPage(logs, parseApplicantLogsPagination(req)));
  } catch (err) {
    console.error(`[GET /api/applicants/${id}/logs] Error:`, err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
