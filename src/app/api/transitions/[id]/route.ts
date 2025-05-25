
// src/app/api/transitions/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import type { UserProfile, TransitionRecord } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const updateTransitionNotesSchema = z.object({
  notes: z.string().optional().nullable(), // Allow clearing notes
});

// PUT /api/transitions/[id] - Update notes of a specific transition record
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to update transition record (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter.`, 'API:Transitions', session.user.id, { targetTransitionId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateTransitionNotesSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for transition notes", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { notes } = validationResult.data;
  const transitionId = params.id;

  try {
    const updateQuery = `
      UPDATE "TransitionRecord" 
      SET notes = $1, "updatedAt" = NOW() 
      WHERE id = $2 
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [notes, transitionId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
    }
    const updatedTransition = result.rows[0];
    await logAudit('AUDIT', `Transition record (ID: ${transitionId}) notes updated by ${session.user.name} (ID: ${session.user.id}). Candidate ID: ${updatedTransition.candidateId}.`, 'API:Transitions', session.user.id, { targetTransitionId: transitionId, candidateId: updatedTransition.candidateId });
    return NextResponse.json(updatedTransition, { status: 200 });
  } catch (error) {
    console.error(`Failed to update transition record ${transitionId}:`, error);
    await logAudit('ERROR', `Failed to update transition record (ID: ${transitionId}). Error: ${(error as Error).message}`, 'API:Transitions', session.user.id, { targetTransitionId: transitionId });
    return NextResponse.json({ message: "Error updating transition record", error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/transitions/[id] - Delete a specific transition record
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
     await logAudit('WARN', `Forbidden attempt to delete transition record (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter.`, 'API:Transitions', session.user.id, { targetTransitionId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  const transitionId = params.id;

  try {
    // Optional: Get candidateId for logging before deleting
    const transitionQuery = 'SELECT "candidateId", stage FROM "TransitionRecord" WHERE id = $1';
    const transitionRes = await pool.query(transitionQuery, [transitionId]);
    
    if (transitionRes.rows.length === 0) {
      return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
    }
    const { candidateId, stage } = transitionRes.rows[0];

    const deleteQuery = 'DELETE FROM "TransitionRecord" WHERE id = $1 RETURNING id;';
    const result = await pool.query(deleteQuery, [transitionId]);

    if (result.rowCount === 0) {
      // Should have been caught by the find query above, but as a safeguard
      return NextResponse.json({ message: "Transition record not found or already deleted" }, { status: 404 });
    }
    
    await logAudit('AUDIT', `Transition record (ID: ${transitionId}, Stage: ${stage}) deleted by ${session.user.name} (ID: ${session.user.id}). Candidate ID: ${candidateId}.`, 'API:Transitions', session.user.id, { targetTransitionId: transitionId, candidateId: candidateId, deletedStage: stage });
    return NextResponse.json({ message: "Transition record deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete transition record ${transitionId}:`, error);
    await logAudit('ERROR', `Failed to delete transition record (ID: ${transitionId}). Error: ${(error as Error).message}`, 'API:Transitions', session.user.id, { targetTransitionId: transitionId });
    return NextResponse.json({ message: "Error deleting transition record", error: (error as Error).message }, { status: 500 });
  }
}
