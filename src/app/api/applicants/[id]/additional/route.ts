import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

type CountRow = {
  total: string | number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'job-matches', 'attachments', 'transitions'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  // Validate UUID
  const uuidSchema = z.string().uuid();
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ message: 'Invalid Applicant ID format' }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    switch (type) {
      case 'job-matches':
        const jobMatchesQuery = `
          SELECT 
            jm.*,
            p.title as "positionTitle",
            p.department as "positionDepartment",
            p.description as "positionDescription"
          FROM "JobMatch" jm
          LEFT JOIN "Position" p ON jm."jobId" = p.id
          WHERE jm."applicant_id" = $1::uuid
          ORDER BY jm."fitScore" DESC
          LIMIT $2 OFFSET $3
        `;
        
        const jobMatchesResult = await client.query(jobMatchesQuery, [id, limit, offset]);
        
        // Get total count
        const jobMatchesCountQuery = `
          SELECT COUNT(*) as total
          FROM "JobMatch" jm
          WHERE jm."applicant_id" = $1::uuid
        `;
        const jobMatchesCountResult = await client.query<CountRow>(jobMatchesCountQuery, [id]);
        const jobMatchesTotal = parseInt(String(jobMatchesCountResult.rows[0].total), 10);
        
        return NextResponse.json({
          data: jobMatchesResult.rows,
          pagination: {
            page,
            limit,
            total: jobMatchesTotal,
            hasMore: offset + limit < jobMatchesTotal
          }
        }, {
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          }
        });

      case 'attachments':
        const attachmentsQuery = `
          SELECT a.*, u.name as "uploadedByUserName"
          FROM "Attachment" a
          LEFT JOIN "User" u ON a."uploadedById" = u.id
          WHERE a."applicantId" = $1::uuid
          ORDER BY a."uploadedAt" DESC
          LIMIT $2 OFFSET $3
        `;
        
        const attachmentsResult = await client.query(attachmentsQuery, [id, limit, offset]);
        
        // Get total count
        const attachmentsCountQuery = `
          SELECT COUNT(*) as total
          FROM "Attachment" a
          WHERE a."applicantId" = $1::uuid
        `;
        const attachmentsCountResult = await client.query<CountRow>(attachmentsCountQuery, [id]);
        const attachmentsTotal = parseInt(String(attachmentsCountResult.rows[0].total), 10);
        
        return NextResponse.json({
          data: attachmentsResult.rows,
          pagination: {
            page,
            limit,
            total: attachmentsTotal,
            hasMore: offset + limit < attachmentsTotal
          }
        }, {
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          }
        });

      case 'transitions':
        const transitionsQuery = `
          SELECT t.*, rs.name as "stageName", u.name as "updatedByUserName"
          FROM "TransitionRecord" t
          LEFT JOIN "RecruitmentStage" rs ON t."stageId" = rs.id
          LEFT JOIN "User" u ON t."updatedById" = u.id
          WHERE t."applicantId" = $1::uuid
          ORDER BY t."updatedAt" DESC
          LIMIT $2 OFFSET $3
        `;
        
        const transitionsResult = await client.query(transitionsQuery, [id, limit, offset]);
        
        // Get total count
        const transitionsCountQuery = `
          SELECT COUNT(*) as total
          FROM "TransitionRecord" t
          WHERE t."applicantId" = $1::uuid
        `;
        const transitionsCountResult = await client.query<CountRow>(transitionsCountQuery, [id]);
        const transitionsTotal = parseInt(String(transitionsCountResult.rows[0].total), 10);
        
        return NextResponse.json({
          data: transitionsResult.rows,
          pagination: {
            page,
            limit,
            total: transitionsTotal,
            hasMore: offset + limit < transitionsTotal
          }
        }, {
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          }
        });

      default:
        return NextResponse.json({ message: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching additional Applicant data:', error);
    return NextResponse.json({ message: 'Error fetching data', error: getErrorMessage(error) }, { status: 500 });
  } finally {
    client.release();
  }
}
