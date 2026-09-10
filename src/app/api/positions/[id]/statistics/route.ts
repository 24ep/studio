export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSystemSetting } from '@/lib/systemSettings';
import { requireApiPermission } from '@/lib/api-route-guards';

const jobMatchApplicantSelect = {
  applicantId: true,
  applicant: {
    select: {
      positionId: true,
    },
  },
} as const satisfies Prisma.JobMatchSelect;

const applicantParsedDataSelect = {
  id: true,
  positionId: true,
  parsedData: true,
} as const satisfies Prisma.ApplicantSelect;

type JobMatchApplicant = Prisma.JobMatchGetPayload<{ select: typeof jobMatchApplicantSelect }>;
type ApplicantParsedDataRow = Prisma.ApplicantGetPayload<{ select: typeof applicantParsedDataSelect }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function applicantHasLegacyJobMatch(applicant: ApplicantParsedDataRow, positionId: string) {
  if (!isRecord(applicant.parsedData) || !Array.isArray(applicant.parsedData.job_matches)) {
    return false;
  }

  return applicant.parsedData.job_matches.some((match) =>
    isRecord(match) && match.jobId === positionId
  );
}

function getParsedDataApplicantIds(applicants: ApplicantParsedDataRow[], positionId: string) {
  return new Set(
    applicants
      .filter(applicant => applicantHasLegacyJobMatch(applicant, positionId))
      .map(applicant => applicant.id)
  );
}

function countMatchingNotApplied(
  jobMatchApplicants: JobMatchApplicant[],
  filteredApplicants: ApplicantParsedDataRow[],
  parsedDataApplicantIds: Set<string>,
  jobMatchApplicantIds: Set<string | null>,
  positionId: string
) {
  const jobMatchNotApplied = jobMatchApplicants.filter((match) =>
    match.applicant?.positionId !== positionId
  ).length;

  const legacyNotApplied = filteredApplicants.filter((applicant) =>
    parsedDataApplicantIds.has(applicant.id) &&
    !jobMatchApplicantIds.has(applicant.id) &&
    applicant.positionId !== positionId
  ).length;

  return jobMatchNotApplied + legacyNotApplied;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireApiPermission('POSITIONS_VIEW');
    if (response) return response;

    const resolvedParams = await params;
    const positionId = resolvedParams.id;
    
    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    // Get total applicants who applied to this position (regardless of status)
    let totalApplied = 0;
    try {
      totalApplied = await prisma.applicant.count({
        where: {
          positionId: positionId
        }
      });
    } catch (error) {
      console.error('Error fetching applied applicants:', error);
      totalApplied = 0;
    }

    // Check if job match feature is enabled
    const jobMatchFeatureEnabled = await getSystemSetting('jobMatchFeatureEnabled');
    const isJobMatchEnabled = jobMatchFeatureEnabled !== 'false';

    // Get applicants who have job matches for this position
    let totalMatching = 0;
    let matchingNotApplied = 0;
    
    if (isJobMatchEnabled) {
      try {
        // Method 1: Check JobMatch table directly (new system)
        const jobMatchApplicants = await prisma.jobMatch.findMany({
          where: {
            jobId: positionId
          },
          select: jobMatchApplicantSelect,
        });

        // Get unique Applicant IDs from JobMatch table
        const jobMatchApplicantIds = new Set(jobMatchApplicants.map((match) => match.applicantId));

        // Method 2: Check parsedData.job_matches (legacy system)
        const filteredApplicants = await prisma.applicant.findMany({
          select: applicantParsedDataSelect,
        });
        
        // Filter applicants who have job matches for this position in parsedData
        const parsedDataApplicantIds = getParsedDataApplicantIds(filteredApplicants, positionId);

        // Combine both sources - get unique Applicant IDs
        const allMatchingApplicantIds = new Set([...jobMatchApplicantIds, ...parsedDataApplicantIds]);
        totalMatching = allMatchingApplicantIds.size;

        // Calculate matching but not applied
        // Get applicants who match but haven't applied to this position
        matchingNotApplied = countMatchingNotApplied(
          jobMatchApplicants,
          filteredApplicants,
          parsedDataApplicantIds,
          jobMatchApplicantIds,
          positionId
        );

      } catch (error) {
        console.error('Error calculating job matching statistics:', error);
        totalMatching = 0;
        matchingNotApplied = 0;
      }
    }

    const result = {
      totalApplied,
      totalMatching,
      matchingNotApplied
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching position statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
