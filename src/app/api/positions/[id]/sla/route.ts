import { NextRequest, NextResponse } from 'next/server';
import { checkSLAViolation, getSLARemainingDays } from '@/lib/slaUtils';
import { getPool } from '@/lib/db';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const positionId = resolvedParams.id;
    if (!positionId) {
      return NextResponse.json({ error: 'Position ID is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(positionId)) {
      return NextResponse.json({ error: 'Invalid position ID format' }, { status: 400 });
    }

    const client = await getPool().connect();
    try {
      // Get position with grade information and earliest requestDate from headcounts
      const positionQuery = `
        SELECT 
          p.id,
          p.title,
          p.department,
          p."isOpen",
          p."recruiterId",
          g.id as "gradeId",
          g.name as "gradeName",
          g."sla_days" as "slaDays",
          g.color as "gradeColor",
          g.is_active as "gradeIsActive",
          g.sort_order as "gradeSortOrder",
          g.min_level as "gradeMinLevel",
          g.max_level as "gradeMaxLevel",
          MIN(h."requestDate") as "requestDate"
        FROM "Position" p
        LEFT JOIN "Grade" g ON p."gradeId" = g.id
        LEFT JOIN "Headcount" h ON p.id = h."positionId"
        WHERE p.id = $1
        GROUP BY p.id, p.title, p.department, p."isOpen", p."recruiterId", 
                 g.id, g.name, g."sla_days", g.color, g.is_active, 
                 g.sort_order, g.min_level, g.max_level
      `;
      
      const positionResult = await client.query(positionQuery, [positionId]);
      
      if (positionResult.rows.length === 0) {
        return NextResponse.json({ error: 'Position not found' }, { status: 404 });
      }

      const positionRow = positionResult.rows[0];
      
      // Build position object
      const position = {
        id: positionRow.id,
        title: positionRow.title,
        department: positionRow.department,
        requestDate: positionRow.requestDate,
        isOpen: positionRow.isOpen,
        recruiterId: positionRow.recruiterId,
        grade: positionRow.gradeId ? {
          id: positionRow.gradeId,
          name: positionRow.gradeName,
          slaDays: positionRow.slaDays,
          color: positionRow.gradeColor,
          isActive: positionRow.gradeIsActive,
          sortOrder: positionRow.gradeSortOrder,
          minLevel: positionRow.gradeMinLevel,
          maxLevel: positionRow.gradeMaxLevel,
        } : null,
      };

      // Validate position has required data for SLA calculation
      if (!position.requestDate) {
        return NextResponse.json({
          violation: null,
          remainingDays: null,
          position: {
            id: position.id,
            title: position.title,
            isOpen: position.isOpen,
            hasGrade: !!position.grade,
            slaDays: position.grade?.slaDays || null,
          },
          error: 'Position does not have a request date set'
        });
      }

      if (!position.grade || !position.grade.slaDays) {
        return NextResponse.json({
          violation: null,
          remainingDays: null,
          position: {
            id: position.id,
            title: position.title,
            isOpen: position.isOpen,
            hasGrade: !!position.grade,
            slaDays: position.grade?.slaDays || null,
          },
          error: 'Position does not have a grade with SLA days configured'
        });
      }

      // Calculate SLA information
      const [violationResult, remainingDays] = await Promise.all([
        checkSLAViolation(position),
        getSLARemainingDays(position)
      ]);

      return NextResponse.json({
        violation: violationResult,
        remainingDays,
        position: {
          id: position.id,
          title: position.title,
          isOpen: position.isOpen,
          hasGrade: !!position.grade,
          slaDays: position.grade?.slaDays || null,
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error calculating SLA for position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
