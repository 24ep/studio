import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { auth } from '@/auth';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

type HeadcountSummaryRow = QueryResultRow & {
  id: string;
  status: string;
  positionId: string;
  applicantId: string | null;
  requestDate: Date | string | null;
  onboardingDate: Date | string | null;
  positionTitle: string;
  positionDepartment: string | null;
  positionLevel: string | null;
  gradeName: string | null;
  slaDays: number | string | null;
  gradeColor: string | null;
  hiredDate: Date | string | null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          h.id, h.status, h."positionId", h."applicantId", h."requestDate", h."onboardingDate",
          p.title as "positionTitle",
          p.department as "positionDepartment",
          p."positionLevel",
          g.name as "gradeName",
          g.sla_days as "slaDays",
          g.color as "gradeColor",
          tr.date as "hiredDate"
        FROM "Headcount" h
        JOIN "Position" p ON h."positionId" = p.id
        LEFT JOIN "Grade" g ON p."gradeId" = g.id
        LEFT JOIN (
          SELECT "applicant_id" as "applicantId", MAX(date) as date
          FROM "TransitionRecord"
          WHERE stage = 'Hired'
          GROUP BY "applicant_id"
        ) tr ON h."applicantId" = tr."applicantId"
        WHERE p."isOpen" = true
        ORDER BY h."requestDate" ASC;
      `;

      const result = await client.query<HeadcountSummaryRow>(query);
      
      const headcounts = result.rows.map((row) => {
        const requestDate = row.requestDate ? new Date(row.requestDate) : null;
        const slaDays = Number(row.slaDays) || 0;
        const hiredDate = row.hiredDate ? new Date(row.hiredDate) : null;
        const status = row.status;
        
        let endDate = new Date();
        if (status === 'filled' && hiredDate) {
          endDate = hiredDate;
        }

        let isViolated = false;
        let daysOverdue = 0;
        let daysRemaining = 0;
        let daysElapsed = 0;

        if (requestDate && slaDays > 0) {
          daysElapsed = Math.floor((endDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
          isViolated = daysElapsed > slaDays;
          daysOverdue = isViolated ? daysElapsed - slaDays : 0;
          daysRemaining = isViolated ? 0 : slaDays - daysElapsed;
        }

        return {
          ...row,
          position: {
            id: row.positionId,
            title: row.positionTitle,
            department: row.positionDepartment,
            positionLevel: row.positionLevel,
            grade: {
              name: row.gradeName,
              slaDays: row.slaDays,
              color: row.gradeColor
            }
          },
          sla: requestDate ? {
            isViolated,
            daysOverdue,
            daysRemaining,
            slaDays,
            gradeName: row.gradeName,
            requestDate: requestDate.toISOString(),
            endDate: endDate.toISOString(),
            daysElapsed
          } : null
        };
      });

      return NextResponse.json(headcounts);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[HEADCOUNT SUMMARY API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
