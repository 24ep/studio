import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { auth } from '@/auth';
import { normalizeFitScore } from '@/lib/scoreUtils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CandidatePositionRow = {
  id: string;
  [key: string]: unknown;
};

type CandidateApplicantRow = {
  positionId: string;
  fitScore?: number | string | null;
  [key: string]: unknown;
};

type CandidateApplicantWithNormalizedFitScore = CandidateApplicantRow & {
  fitScore: number | null;
};

function getCsvValues(value: string | null): string[] {
  return value?.split(',').filter((id) => id.length > 0) ?? [];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown candidates API error';
}

function groupApplicantsByPosition(applicants: CandidateApplicantRow[]) {
  return applicants.reduce<Map<string, CandidateApplicantWithNormalizedFitScore[]>>((groups, applicant) => {
    const positionApplicants = groups.get(applicant.positionId) ?? [];
    positionApplicants.push({
      ...applicant,
      fitScore: applicant.fitScore === null || applicant.fitScore === undefined
        ? null
        : normalizeFitScore(Number(applicant.fitScore)),
    });
    groups.set(applicant.positionId, positionApplicants);
    return groups;
  }, new Map());
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isOpenParam = searchParams.get('isOpen');
  const mineOnlyParam = searchParams.get('mineOnly');
  const pipelineOnlyParam = searchParams.get('pipelineOnly');
  
  const isOpen = isOpenParam === 'any' ? 'any' : (isOpenParam === null ? true : isOpenParam === 'true'); 
  const mineOnly = mineOnlyParam === null ? true : mineOnlyParam === 'true';

  // We check permissions
  const canViewAll = hasPermission(session.user, 'applicantS_VIEW_ALL');
  const isAdmin = session.user.role === 'Admin';
  const hasFullView = canViewAll || isAdmin;
  
  // If user doesn't have full view, forcing mineOnly to true
  const effectivelyMineOnly = !hasFullView || mineOnly;

  let client;
  try {
    client = await getPool().connect();
    
    let positionQuery: string;
    const queryParams: unknown[] = [];
    const whereClauses: string[] = [];
    
    // Status filter (isOpen)
    if (isOpenParam !== 'any') {
      whereClauses.push(`p."isOpen" = $${queryParams.length + 1}`);
      queryParams.push(isOpen === 'any' ? true : isOpen); // fallback if logic above fails
    }

    // Association filter
    if (effectivelyMineOnly) {
      whereClauses.push(`(pi."userId" = $${queryParams.length + 1} OR p."recruiterId" = $${queryParams.length + 1})`);
      queryParams.push(session.user.id);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    positionQuery = `
      SELECT DISTINCT p.*, g.name as "gradeName", g.color as "gradeColor"
      FROM "Position" p
      LEFT JOIN "Grade" g ON p."gradeId" = g.id
      LEFT JOIN "PositionInterviewer" pi ON p.id = pi."positionId"
      ${whereString}
      ORDER BY p."createdAt" DESC
    `;
    
    const positionResult = await client.query<CandidatePositionRow>(positionQuery, queryParams);
    const positions = positionResult.rows;

    if (positions.length === 0) {
      return NextResponse.json({ positions: [] });
    }

    const positionIds = positions.map(p => p.id);

    // 2. Fetch recruitment stages to filter by status if pipelineOnly is requested
    const hasPipelineFocus = pipelineOnlyParam && pipelineOnlyParam !== 'false';
    let pipelineFilterClause = '';
    const applicantQueryParams: unknown[] = [positionIds];

    if (hasPipelineFocus) {
      const statusIds = getCsvValues(pipelineOnlyParam);
      if (statusIds.length > 0) {
        pipelineFilterClause = `AND c."statusId" = ANY($2::uuid[])`;
        applicantQueryParams.push(statusIds);
      }
    }

    // 3. Fetch applicants for these positions
    const applicantQuery = `
      SELECT c.*, rs.name as "statusName", rs.color_badge as "statusColor", rs.sort_order as "statusOrder"
      FROM "Applicant" c
      LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
      WHERE c."positionId" = ANY($1::uuid[])
      ${pipelineFilterClause}
      ORDER BY c."applicationDate" DESC
    `;

    const applicantResult = await client.query<CandidateApplicantRow>(applicantQuery, applicantQueryParams);
    const applicantsByPosition = groupApplicantsByPosition(applicantResult.rows);

    // 4. Group applicants by position
    const groupedData = positions.map(pos => {
      const posApplicants = applicantsByPosition.get(pos.id) ?? [];
      return {
        ...pos,
        applicants: posApplicants
      };
    }).filter(pos => !hasPipelineFocus || pos.applicants.length > 0); // If pipelineOnly, don't show empty positions

    return NextResponse.json({ positions: groupedData });

  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[Candidates API] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
