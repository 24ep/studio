import { NextResponse } from 'next/server';
import type { TaskboardApplicantRow, TaskboardPagination } from './taskboard-applicants-types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function serializeTaskboardApplicants(rows: TaskboardApplicantRow[]) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    fitScore: row.fitScore,
    status: row.status,
    statusId: row.statusId,
    applicationDate: row.applicationDate,
    updatedAt: row.updatedAt,
    positionId: row.positionId,
    recruiterId: row.recruiterId,
    parsedData: row.parsedData,
    avatarUrl: row.avatarUrl,
    position: row.positionTitle ? { title: row.positionTitle } : null,
    recruiter: row.recruiterName ? { name: row.recruiterName } : null,
  }));
}

export function taskboardApplicantsSuccessResponse(input: {
  applicants: unknown[];
  pagination: TaskboardPagination;
  responseTime: number;
}) {
  return NextResponse.json(
    {
      data: input.applicants,
      pagination: {
        page: input.pagination.page,
        limit: input.pagination.limit,
        hasNext: input.applicants.length === input.pagination.limit,
        hasPrev: input.pagination.page > 1,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${input.responseTime}ms`,
        'X-Page-Size': input.pagination.limit.toString(),
      },
    }
  );
}

export function taskboardApplicantsErrorResponse(error: unknown, responseTime: number) {
  return NextResponse.json(
    {
      message: 'Error fetching taskboard Applicants',
      error: getErrorMessage(error),
      responseTime: `${responseTime}ms`,
    },
    { status: 500 }
  );
}
