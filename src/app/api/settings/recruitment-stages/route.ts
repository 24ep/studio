
// src/app/api/settings/recruitment-stages/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { RecruitmentStage } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const createRecruitmentStageSchema = z.object({
  name: z.string().min(1, { message: "Stage name is required" }).max(100),
  description: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().optional(), // Made optional, will be auto-assigned if not provided
});

export async function GET(request: NextRequest) {
  // No session check for GET, can be public or protected by RBAC at page level
  try {
    const result = await pool.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch recruitment stages:", error);
    return NextResponse.json({ message: "Error fetching recruitment stages", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('RECRUITMENT_STAGES_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to create recruitment stage by user ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required role: Admin or permission RECRUITMENT_STAGES_MANAGE.`, 'API:RecruitmentStages:Create', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = createRecruitmentStageSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, description } = validationResult.data;
  let { sort_order } = validationResult.data; // sort_order can be undefined here

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const newStageId = uuidv4();

    if (sort_order === undefined) {
      // If sort_order is not provided, calculate the next available one (e.g., max + 10)
      const maxSortOrderResult = await client.query('SELECT COALESCE(MAX(sort_order), -10) as max_order FROM "RecruitmentStage"');
      sort_order = (maxSortOrderResult.rows[0].max_order || 0) + 10;
    } else {
      // If sort_order IS provided, check if it's unique. If not, this could be an issue
      // or we might need logic to shift other stages. For now, we'll assume client handles providing a reasonable initial order.
      // A more robust system might auto-increment subsequent orders if a duplicate is provided.
    }
    
    // Custom stages are not system stages by default
    const insertQuery = `
      INSERT INTO "RecruitmentStage" (id, name, description, is_system, sort_order, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, FALSE, $4, NOW(), NOW())
      RETURNING *;
    `;
    const result = await client.query(insertQuery, [newStageId, name, description, sort_order]);
    const newStage = result.rows[0];
    await client.query('COMMIT');

    await logAudit('AUDIT', `Recruitment stage '${newStage.name}' (ID: ${newStage.id}) created by ${session.user.name}. Sort order: ${sort_order}.`, 'API:RecruitmentStages:Create', session.user.id, { stageId: newStage.id, stageName: newStage.name, sortOrder: sort_order });
    return NextResponse.json(newStage, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to create recruitment stage:", error);
    if (error.code === '23505' && error.constraint === 'RecruitmentStage_name_key') {
      await logAudit('WARN', `Attempt to create recruitment stage with duplicate name '${name}' by ${session.user.name}.`, 'API:RecruitmentStages:Create', session.user.id, { stageName: name });
      return NextResponse.json({ message: "A recruitment stage with this name already exists." }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to create recruitment stage '${name}' by ${session.user.name}. Error: ${error.message}`, 'API:RecruitmentStages:Create', session.user.id, { stageName: name });
    return NextResponse.json({ message: "Error creating recruitment stage", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
    
