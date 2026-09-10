import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkSLAViolationForHeadcount, getSLARemainingDaysForHeadcount } from '@/lib/slaUtils';
import { getPool } from '@/lib/db';

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
    const headcountId = resolvedParams.id;
    if (!headcountId) {
      return NextResponse.json({ error: 'Headcount ID is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(headcountId)) {
      return NextResponse.json({ error: 'Invalid headcount ID format' }, { status: 400 });
    }

    const client = await getPool().connect();
    try {
      // Get headcount with position and grade information
      const headcountQuery = `
        SELECT 
          h.id,
          h."positionId",
          h.type,
          h.status,
          h."applicantId",
          h."onboardingDate",
          h."requestDate",
          h.notes,
          h."memo_id",
          h."custom_fields",
          h."createdAt",
          h."updatedAt",
          p.title as "positionTitle",
          p.department as "positionDepartment",
          p."isOpen" as "positionIsOpen",
          p."recruiterId" as "positionRecruiterId",
          g.id as "gradeId",
          g.name as "gradeName",
          g."sla_days" as "slaDays",
          g.color as "gradeColor",
          g.is_active as "gradeIsActive",
          g.sort_order as "gradeSortOrder",
          g.min_level as "gradeMinLevel",
          g.max_level as "gradeMaxLevel"
        FROM "Headcount" h
        LEFT JOIN "Position" p ON h."positionId" = p.id
        LEFT JOIN "Grade" g ON p."gradeId" = g.id
        WHERE h.id = $1
      `;
      
      const headcountResult = await client.query(headcountQuery, [headcountId]);
      
      if (headcountResult.rows.length === 0) {
        return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });
      }

      const headcountRow = headcountResult.rows[0];
      
      // Build headcount object with position and grade information
      const headcount = {
        id: headcountRow.id,
        positionId: headcountRow.positionId,
        type: headcountRow.type,
        status: headcountRow.status,
        applicantId: headcountRow.applicantId,
        onboardingDate: headcountRow.onboardingDate,
        requestDate: headcountRow.requestDate,
        notes: headcountRow.notes,
        memoId: headcountRow.memo_id,
        customFields: headcountRow.custom_fields,
        createdAt: headcountRow.createdAt,
        updatedAt: headcountRow.updatedAt,
        position: {
          id: headcountRow.positionId,
          title: headcountRow.positionTitle,
          department: headcountRow.positionDepartment,
          isOpen: headcountRow.positionIsOpen,
          recruiterId: headcountRow.positionRecruiterId,
          grade: headcountRow.gradeId ? {
            id: headcountRow.gradeId,
            name: headcountRow.gradeName,
            slaDays: headcountRow.slaDays,
            color: headcountRow.gradeColor,
            isActive: headcountRow.gradeIsActive,
            sortOrder: headcountRow.gradeSortOrder,
            minLevel: headcountRow.gradeMinLevel,
            maxLevel: headcountRow.gradeMaxLevel,
          } : null,
        },
      };

      // Let the SLA calculation function handle validation
      // This allows for more flexible error handling in the frontend

      // Calculate SLA information for this headcount
      const [violationResult, remainingDays] = await Promise.all([
        checkSLAViolationForHeadcount(headcount),
        getSLARemainingDaysForHeadcount(headcount)
      ]);

      // Determine if there's an error based on missing data
      let errorMessage = null;
      if (!headcount.requestDate) {
        errorMessage = 'Headcount does not have a request date set';
      } else if (!headcount.position.grade || !headcount.position.grade.slaDays) {
        errorMessage = 'Position does not have a grade with SLA days configured';
      }

      return NextResponse.json({
        violation: violationResult,
        remainingDays,
        headcount: {
          id: headcount.id,
          type: headcount.type,
          status: headcount.status,
          positionTitle: headcount.position.title,
          hasGrade: !!headcount.position.grade,
          slaDays: headcount.position.grade?.slaDays || null,
        },
        ...(errorMessage && { error: errorMessage })
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error calculating SLA for headcount:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
