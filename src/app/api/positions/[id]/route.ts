import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getRedisClient, CACHE_KEY_POSITIONS } from '@/lib/redis';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const query = 'SELECT id, title, department, description, "isOpen", position_level, custom_attributes, "createdAt", "updatedAt" FROM "Position" WHERE id = $1';
    const result = await pool.query(query, [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    const position = {
        ...result.rows[0],
        custom_attributes: result.rows[0].custom_attributes || {},
    };
    return NextResponse.json(position, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch position ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch position ${params.id}. Error: ${(error as Error).message}`, 'API:Positions', null, { targetPositionId: params.id });
    return NextResponse.json({ message: "Error fetching position", error: (error as Error).message }, { status: 500 });
  }
}

const updatePositionSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isOpen: z.boolean().optional(),
  position_level: z.string().optional().nullable(),
  custom_attributes: z.record(z.any()).optional().nullable(), // New
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const positionExistsQuery = 'SELECT id, custom_attributes FROM "Position" WHERE id = $1';
    const positionResult = await pool.query(positionExistsQuery, [params.id]);
    if (positionResult.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    const existingPosition = positionResult.rows[0];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'custom_attributes') {
            updateFields.push(`"custom_attributes" = $${paramIndex++}`);
            updateValues.push(value || {}); // Ensure it's an object
        } else {
            updateFields.push(`"${key}" = $${paramIndex++}`);
            updateValues.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
        const currentPosition = await pool.query('SELECT * FROM "Position" WHERE id = $1', [params.id]);
        return NextResponse.json({ ...currentPosition.rows[0], custom_attributes: currentPosition.rows[0].custom_attributes || {} }, { status: 200 });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id);

    const updateQuery = `UPDATE "Position" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const updatedResult = await pool.query(updateQuery, updateValues);
    const updatedPosition = {
        ...updatedResult.rows[0],
        custom_attributes: updatedResult.rows[0].custom_attributes || {},
    };

    const redisClient = await getRedisClient();
    if (redisClient) {
        await redisClient.del(CACHE_KEY_POSITIONS);
    }

    await logAudit('AUDIT', `Position '${updatedPosition.title}' (ID: ${updatedPosition.id}) updated.`, 'API:Positions', null, { targetPositionId: updatedPosition.id, changes: Object.keys(validatedData) });
    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error(`Failed to update position ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update position ${params.id}. Error: ${(error as Error).message}`, 'API:Positions', null, { targetPositionId: params.id });
    return NextResponse.json({ message: "Error updating position", error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const positionQuery = 'SELECT p.id, p.title, COUNT(c.id) as "candidateCount" FROM "Position" p LEFT JOIN "Candidate" c ON p.id = c."positionId" WHERE p.id = $1 GROUP BY p.id, p.title;';
    const positionResult = await pool.query(positionQuery, [params.id]);

    if (positionResult.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    const positionTitle = positionResult.rows[0].title;

    if (parseInt(positionResult.rows[0].candidateCount, 10) > 0) {
        await logAudit('WARN', `Attempt to delete position '${positionTitle}' (ID: ${params.id}) with associated candidates. Action denied.`, 'API:Positions', null, { targetPositionId: params.id });
        return NextResponse.json({ message: "Cannot delete position with associated candidates. Please reassign or delete candidates first." }, { status: 409 });
    }
    
    const deleteQuery = 'DELETE FROM "Position" WHERE id = $1';
    await pool.query(deleteQuery, [params.id]);

    const redisClient = await getRedisClient();
    if (redisClient) {
        await redisClient.del(CACHE_KEY_POSITIONS);
    }
    
    await logAudit('AUDIT', `Position '${positionTitle}' (ID: ${params.id}) deleted.`, 'API:Positions', null, { targetPositionId: params.id, deletedPositionTitle: positionTitle });
    return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
  } catch (error: any) {
     console.error(`Failed to delete position ${params.id}:`, error);
     await logAudit('ERROR', `Failed to delete position ${params.id}. Error: ${(error as Error).message}`, 'API:Positions', null, { targetPositionId: params.id });
     if (error.code === '23503') {
        return NextResponse.json({ message: "Cannot delete this position as it is still referenced by other entities (e.g., candidates)." }, { status: 409 });
     }
    return NextResponse.json({ message: "Error deleting position", error: error.message }, { status: 500 });
  }
}
