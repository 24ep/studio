import { NextResponse, type NextRequest } from 'next/server';
import { normalizeFitScore } from '@/lib/scoreUtils';
import type { PositionJobMatchesPagination } from './position-job-matches-schema';

export type PositionJobMatchApplicantRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  dataAiHint?: string | null;
  resumePath?: string | null;
  parsedData?: unknown;
  customAttributes?: unknown;
  positionId?: string | null;
  positionTitle?: string | null;
  positionDepartment?: string | null;
  positionLevel?: string | null;
  fitScore?: number | string | null;
  matchScore?: number | string | null;
  matchReasons?: unknown[];
  jobMatchId?: string | null;
  statusId?: string | null;
  statusName?: string | null;
  applicationDate?: Date | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterAvatarUrl?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  transitionHistory?: unknown[];
  jobMatches?: unknown[];
  isPinned?: boolean | null;
  pinnedAt?: Date | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function serializePositionJobMatchApplicants(rows: PositionJobMatchApplicantRow[]) {
  return rows.map((row) => {
    let customAttributes = row.customAttributes || {};
    if (typeof customAttributes === 'string') {
      try {
        customAttributes = JSON.parse(customAttributes);
      } catch {
        customAttributes = {};
      }
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      avatarUrl: row.avatarUrl || null,
      dataAiHint: row.dataAiHint || null,
      resumePath: row.resumePath || null,
      parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
      customAttributes,
      position: row.positionId ? {
        id: row.positionId,
        title: row.positionTitle,
        department: row.positionDepartment,
        positionLevel: row.positionLevel,
      } : null,
      fitScore: normalizeFitScore(toNumber(row.fitScore)),
      matchScore: normalizeFitScore(toNumber(row.matchScore)),
      matchReasons: row.matchReasons || [],
      jobMatchId: row.jobMatchId,
      statusId: row.statusId,
      status: row.statusName || 'Unknown',
      applicationDate: row.applicationDate ? row.applicationDate.toISOString() : new Date().toISOString(),
      recruiter: row.recruiterId ? {
        id: row.recruiterId,
        name: row.recruiterName,
        avatarUrl: row.recruiterAvatarUrl || null,
        email: null,
      } : null,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
      transitionHistory: row.transitionHistory || [],
      jobMatches: row.jobMatches || [],
      associationType: 'matched',
      isPinned: row.isPinned || false,
      pinnedAt: row.pinnedAt ? row.pinnedAt.toISOString() : null,
    };
  });
}

export function positionJobMatchesSuccessResponse(input: {
  applicants: unknown[];
  pagination: PositionJobMatchesPagination;
  total: number;
}) {
  return NextResponse.json(
    {
      data: input.applicants,
      pagination: {
        page: input.pagination.page,
        limit: input.pagination.limit,
        total: input.total,
        totalPages: Math.ceil(input.total / input.pagination.limit),
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

export function positionJobMatchesErrorResponse(request: NextRequest, error: unknown) {
  console.error('Error fetching position job matches:', error);

  try {
    const { searchParams } = new URL(request.url);
    console.error('Position ID (from path):', request.url.split('/positions/')[1]?.split('/')[0]);
    console.error('Search params:', Object.fromEntries(searchParams));
  } catch {}
  console.error('Error stack:', getErrorStack(error));

  return NextResponse.json(
    {
      message: 'Error fetching position job matches',
      error: getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? getErrorStack(error) : undefined,
      positionId: request.url.split('/positions/')[1]?.split('/')[0],
      searchParams: (() => {
        try {
          return Object.fromEntries(new URL(request.url).searchParams);
        } catch {
          return {};
        }
      })(),
    },
    { status: 500 }
  );
}
