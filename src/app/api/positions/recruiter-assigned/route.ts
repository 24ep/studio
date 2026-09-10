import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';
import type { QueryResultRow } from 'pg';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

type RecruiterAssignedPositionRow = QueryResultRow & {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  positionLevel: string | null;
  isOpen: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  gradeName: string | null;
  gradeColor: string | null;
  gradeSlaDays: string | number | null;
  totalHeadcount: string | number;
  vacantHeadcount: string | number;
  filledHeadcount: string | number;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view positions
    if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view positions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get('recruiterId');

    if (!recruiterId) {
      return NextResponse.json({ error: 'Recruiter ID is required' }, { status: 400 });
    }

    // Allow any authenticated user with POSITIONS_VIEW permission to view assigned positions for the specified recruiter

    const client = await getPool().connect();
    
    try {
      // Query to get open positions assigned to the recruiter with headcount information
      const query = `
        SELECT 
          p.id,
          p.title,
          p.department,
          p.description,
          p."positionLevel",
          p."isOpen",
          p."createdAt",
          p."updatedAt",
          g.name as "gradeName",
          g.color as "gradeColor",
          g."sla_days" as "gradeSlaDays",
          COALESCE(hc_stats.total_headcount, 0) as "totalHeadcount",
          COALESCE(hc_stats.vacant_headcount, 0) as "vacantHeadcount",
          COALESCE(hc_stats.filled_headcount, 0) as "filledHeadcount"
        FROM "Position" p
        LEFT JOIN "Grade" g ON p."gradeId" = g.id
        LEFT JOIN (
          SELECT 
            h."positionId",
            COUNT(*) as total_headcount,
            COUNT(CASE WHEN h.status = 'vacant' OR h."applicantId" IS NULL THEN 1 END) as vacant_headcount,
            COUNT(CASE WHEN h.status = 'filled' AND h."applicantId" IS NOT NULL THEN 1 END) as filled_headcount
          FROM "Headcount" h
          GROUP BY h."positionId"
        ) hc_stats ON p.id = hc_stats."positionId"
        WHERE p."recruiterId" = $1 
          AND p."isOpen" = true
        ORDER BY p."createdAt" DESC
      `;

      const result = await client.query<RecruiterAssignedPositionRow>(query, [recruiterId]);
      
      const positions = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        department: row.department,
        description: row.description,
        positionLevel: row.positionLevel,
        isOpen: row.isOpen,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        grade: row.gradeName ? {
          name: row.gradeName,
          color: row.gradeColor
        } : null,
        gradeSlaDays: row.gradeSlaDays ? parseInt(String(row.gradeSlaDays), 10) : null,
        headcount: {
          total: parseInt(String(row.totalHeadcount), 10) || 0,
          vacant: parseInt(String(row.vacantHeadcount), 10) || 0,
          filled: parseInt(String(row.filledHeadcount), 10) || 0
        }
      }));

      return NextResponse.json({ 
        data: positions,
        total: positions.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching recruiter assigned positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
