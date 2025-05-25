
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import type { UserProfile } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
   if (!userRole || !['Admin', 'Recruiter', 'Hiring Manager'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to view position (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter, Hiring Manager.`, 'API:Positions', session.user.id, { targetPositionId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const query = 'SELECT * FROM "Position" WHERE id = $1';
    const result = await pool.query(query, [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch position ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch position ${params.id}. Error: ${(error as Error).message}`, 'API:Positions', session.user.id, { targetPositionId: params.id });
    return NextResponse.json({ message: "Error fetching position", error: (error as Error).message }, { status: 500 });
  }
}

const updatePositionSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  description: z.string().optional(),
  isOpen: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
     await logAudit('WARN', `Forbidden attempt to update position (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter.`, 'API:Positions', session.user.id, { targetPositionId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to update positions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body for position update:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updatePositionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  
  const validatedData = validationResult.data;
  
  try {
    const positionExistsQuery = 'SELECT id FROM "Position" WHERE id = $1';
    const positionResult = await pool.query(positionExistsQuery, [params.id]);
    if (positionResult.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
        const currentPosition = await pool.query('SELECT * FROM "Position" WHERE id = $1', [params.id]);
        return NextResponse.json(currentPosition.rows[0], { status: 200 });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id); 

    const updateQuery = `UPDATE "Position" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const updatedResult = await pool.query(updateQuery, updateValues);
    const updatedPosition = updatedResult.rows[0];

    await logAudit('AUDIT', `Position '${updatedPosition.title}' (ID: ${updatedPosition.id}) updated by ${session.user.name} (ID: ${session.user.id}).`, 'API:Positions', session.user.id, { targetPositionId: updatedPosition.id, changes: Object.keys(validatedData) });
    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error(`Failed to update position ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update position ${params.id}. Error: ${(error as Error).message}`, 'API:Positions', session.user.id, { targetPositionId: params.id });
    return NextResponse.json({ message: "Error updating position", error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin') {
    await logAudit('WARN', `Forbidden attempt to delete position (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required role: Admin.`, 'API:Positions', session.user.id, { targetPositionId: params.id });
    return NextResponse.json({ message: "Forbidden: Only Admins can delete positions" }, { status: 403 });
  }

  try {
    const positionQuery = 'SELECT p.id, p.title, COUNT(c.id) as "candidateCount" FROM "Position" p LEFT JOIN "Candidate" c ON p.id = c."positionId" WHERE p.id = $1 GROUP BY p.id, p.title;';
    const positionResult = await pool.query(positionQuery, [params.id]);

    if (positionResult.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    const positionTitle = positionResult.rows[0].title;

    if (parseInt(positionResult.rows[0].candidateCount, 10) > 0) {
        await logAudit('WARN', `Attempt to delete position '${positionTitle}' (ID: ${params.id}) with associated candidates by ${session.user.name} (ID: ${session.user.id}). Action denied.`, 'API:Positions', session.user.id, { targetPositionId: params.id });
        return NextResponse.json({ message: "Cannot delete position with associated candidates. Please reassign or delete candidates first." }, { status: 409 });
    }
    
    const deleteQuery = 'DELETE FROM "Position" WHERE id = $1';
    await pool.query(deleteQuery, [params.id]);
    
    await logAudit('AUDIT', `Position '${positionTitle}' (ID: ${params.id}) deleted by ${session.user.name} (ID: ${session.user.id}).`, 'API:Positions', session.user.id, { targetPositionId: params.id, deletedPositionTitle: positionTitle });
    return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
  } catch (error: any) {
     console.error(`Failed to delete position ${params.id}:`, error);
     await logAudit('ERROR', `Failed to delete position ${params.id}. Error: ${(error as Error).message}`, 'API:Positions', session.user.id, { targetPositionId: params.id });
     if (error.code === '23503') { 
        return NextResponse.json({ message: "Cannot delete this position as it is still referenced by other entities (e.g., candidates)." }, { status: 409 });
     }
    return NextResponse.json({ message: "Error deleting position", error: error.message }, { status: 500 });
  }
}
