
// src/app/api/settings/recruitment-stages/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../../lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { RecruitmentStage } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const updateRecruitmentStageSchema = z.object({
  name: z.string().min(1, { message: "Stage name is required" }).max(100).optional(),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('RECRUITMENT_STAGES_MANAGE')) {
     await logAudit('WARN', `Forbidden attempt to update recruitment stage (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:RecruitmentStages:Update', session?.user?.id, { targetStageId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateRecruitmentStageSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  
  const updates = validationResult.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existingStageResult = await client.query('SELECT * FROM "RecruitmentStage" WHERE id = $1 FOR UPDATE', [params.id]);
    if (existingStageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Recruitment stage not found" }, { status: 404 });
    }
    const existingStage: RecruitmentStage = existingStageResult.rows[0];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      if (existingStage.is_system) {
        await client.query('ROLLBACK');
        await logAudit('WARN', `Attempt to rename system recruitment stage '${existingStage.name}' (ID: ${params.id}) by ${session.user.name}. Denied.`, 'API:RecruitmentStages:Update', session.user.id, { targetStageId: params.id });
        return NextResponse.json({ message: "System stage names cannot be changed." }, { status: 400 });
      }
      if (updates.name !== existingStage.name) {
        const nameCheck = await client.query('SELECT id FROM "RecruitmentStage" WHERE name = $1 AND id != $2', [updates.name, params.id]);
        if (nameCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Another recruitment stage with this name already exists." }, { status: 409 });
        }
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(updates.name);
      }
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updates.description);
    }
    if (updates.sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(updates.sort_order);
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(existingStage, { status: 200 }); // No actual changes
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id);

    const updateQuery = `UPDATE "RecruitmentStage" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const result = await client.query(updateQuery, updateValues);
    const updatedStage = result.rows[0];

    await client.query('COMMIT');
    await logAudit('AUDIT', `Recruitment stage '${updatedStage.name}' (ID: ${updatedStage.id}) updated by ${session.user.name}.`, 'API:RecruitmentStages:Update', session.user.id, { targetStageId: updatedStage.id, changes: Object.keys(updates) });
    return NextResponse.json(updatedStage, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to update recruitment stage ${params.id}:`, error);
     if (error.code === '23505' && error.constraint === 'RecruitmentStage_name_key') {
      await logAudit('WARN', `Attempt to update recruitment stage resulting in duplicate name for ID ${params.id} by ${session.user.name}.`, 'API:RecruitmentStages:Update', session.user.id, { targetStageId: params.id, attemptedName: updates.name });
      return NextResponse.json({ message: "A recruitment stage with this name already exists." }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to update recruitment stage (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:RecruitmentStages:Update', session.user.id, { targetStageId: params.id });
    return NextResponse.json({ message: "Error updating recruitment stage", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('RECRUITMENT_STAGES_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to delete recruitment stage (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:RecruitmentStages:Delete', session?.user?.id, { targetStageId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const replacementStageName = searchParams.get('replacementStageName');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const stageResult = await client.query('SELECT id, name, is_system FROM "RecruitmentStage" WHERE id = $1 FOR UPDATE', [params.id]);
    if (stageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Recruitment stage not found" }, { status: 404 });
    }
    const stageToDelete: RecruitmentStage = stageResult.rows[0];

    if (stageToDelete.is_system) {
      await client.query('ROLLBACK');
      await logAudit('WARN', `Attempt to delete system recruitment stage '${stageToDelete.name}' (ID: ${params.id}) by ${session.user.name}. Denied.`, 'API:RecruitmentStages:Delete', session.user.id, { targetStageId: params.id });
      return NextResponse.json({ message: "System stages cannot be deleted." }, { status: 400 });
    }

    // Check if stage is in use
    const candidateCheck = await client.query('SELECT 1 FROM "Candidate" WHERE status = $1 LIMIT 1', [stageToDelete.name]);
    const transitionCheck = await client.query('SELECT 1 FROM "TransitionRecord" WHERE stage = $1 LIMIT 1', [stageToDelete.name]);
    const isInUse = candidateCheck.rows.length > 0 || transitionCheck.rows.length > 0;

    if (isInUse && !replacementStageName) {
      await client.query('ROLLBACK');
      await logAudit('INFO', `Attempt to delete recruitment stage '${stageToDelete.name}' (ID: ${params.id}) which is in use, by ${session.user.name}. Needs replacement.`, 'API:RecruitmentStages:Delete', session.user.id, { targetStageId: params.id });
      return NextResponse.json({ message: "Stage is in use. Please provide a replacement stage to migrate records.", needsReplacement: true }, { status: 409 });
    }

    if (isInUse && replacementStageName) {
      const replacementStageResult = await client.query('SELECT id, name FROM "RecruitmentStage" WHERE name = $1 AND id != $2 AND is_system = FALSE', [replacementStageName, stageToDelete.id]);
      if (replacementStageResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: `Invalid replacement stage: "${replacementStageName}" not found or is the same stage or a system stage.` }, { status: 400 });
      }
      const validReplacementStage = replacementStageResult.rows[0];

      // Migrate candidates
      await client.query('UPDATE "Candidate" SET status = $1, "updatedAt" = NOW() WHERE status = $2', [validReplacementStage.name, stageToDelete.name]);
      // Migrate transition records
      await client.query('UPDATE "TransitionRecord" SET stage = $1, "updatedAt" = NOW() WHERE stage = $2', [validReplacementStage.name, stageToDelete.name]);
      await logAudit('AUDIT', `Recruitment stage '${stageToDelete.name}' (ID: ${params.id}) data migrated to '${validReplacementStage.name}' by ${session.user.name}.`, 'API:RecruitmentStages:Migrate', session.user.id, { oldStage: stageToDelete.name, newStage: validReplacementStage.name });
    }

    const deleteResult = await client.query('DELETE FROM "RecruitmentStage" WHERE id = $1', [params.id]);
    await client.query('COMMIT');

    if (deleteResult.rowCount === 0) {
        // This case should ideally not be reached if the FOR UPDATE lock worked and stage wasn't deleted by another transaction
        return NextResponse.json({ message: "Recruitment stage not found or already deleted during transaction" }, { status: 404 });
    }
    await logAudit('AUDIT', `Recruitment stage '${stageToDelete.name}' (ID: ${params.id}) deleted by ${session.user.name}.`, 'API:RecruitmentStages:Delete', session.user.id, { targetStageId: params.id, deletedStageName: stageToDelete.name });
    return NextResponse.json({ message: "Recruitment stage deleted successfully" }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to delete recruitment stage ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete recruitment stage (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:RecruitmentStages:Delete', session.user.id, { targetStageId: params.id });
    return NextResponse.json({ message: "Error deleting recruitment stage", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

    