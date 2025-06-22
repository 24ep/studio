import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getRedisClient, CACHE_KEY_POSITIONS } from '@/lib/redis';
import { getPool } from '@/lib/db';

export const dynamic = "force-dynamic";

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/positions\/([^/]+)/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  const id = extractIdFromUrl(request);
  try {
    const query = 'SELECT id, title, department, description, "isOpen", position_level, "customAttributes", "createdAt", "updatedAt" FROM "positions" WHERE id = $1';
    const result = await getPool().query(query, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    const position = {
        ...result.rows[0],
        custom_attributes: result.rows[0].customAttributes || {},
    };
    return NextResponse.json(position, { status: 200 });
  } catch (error) {
    console.error('Error in /api/positions/[id]:', error);
    await logAudit('ERROR', `Failed to fetch position ${id}. Error: ${(error as Error).message}`, 'API:Positions', null, { targetPositionId: id });
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

export async function PUT(request: NextRequest) {
  const id = extractIdFromUrl(request);
  const session = await getServerSession(authOptions);
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
    const positionExistsQuery = 'SELECT id, "customAttributes" FROM "positions" WHERE id = $1';
    const positionResult = await getPool().query(positionExistsQuery, [id]);
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
            updateFields.push(`"customAttributes" = $${paramIndex++}`);
            updateValues.push(value || {}); // Ensure it's an object
        } else {
            updateFields.push(`"${key}" = $${paramIndex++}`);
            updateValues.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
        const currentPosition = await getPool().query('SELECT * FROM "positions" WHERE id = $1', [id]);
        return NextResponse.json({ ...currentPosition.rows[0], custom_attributes: currentPosition.rows[0].customAttributes || {} }, { status: 200 });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(id);

    const updateQuery = `UPDATE "positions" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const updatedResult = await getPool().query(updateQuery, updateValues);
    const updatedPosition = {
        ...updatedResult.rows[0],
        custom_attributes: updatedResult.rows[0].customAttributes || {},
    };

    const redisClient = await getRedisClient();
    if (redisClient) {
        await redisClient.del(CACHE_KEY_POSITIONS);
    }

    await logAudit('AUDIT', `Position '${updatedPosition.title}' (ID: ${updatedPosition.id}) updated.`, 'API:Positions', null, { targetPositionId: updatedPosition.id, changes: Object.keys(validatedData) });
    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error('Error in /api/positions/[id]:', error);
    await logAudit('ERROR', `Failed to update position ${id}. Error: ${(error as Error).message}`, 'API:Positions', null, { targetPositionId: id });
    return NextResponse.json({ message: "Error updating position", error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = extractIdFromUrl(request);
  try {
    const positionQuery = 'SELECT p.id, p.title, COUNT(c.id) as "candidateCount" FROM "positions" p LEFT JOIN "candidates" c ON p.id = c."positionId" WHERE p.id = $1 GROUP BY p.id, p.title;';
    const positionResult = await getPool().query(positionQuery, [id]);

    if (positionResult.rows.length === 0) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    const positionTitle = positionResult.rows[0].title;

    if (parseInt(positionResult.rows[0].candidateCount, 10) > 0) {
        await logAudit('WARN', `Attempt to delete position '${positionTitle}' (ID: ${id}) with associated candidates. Action denied.`, 'API:Positions', null, { targetPositionId: id });
        return NextResponse.json({ message: "Cannot delete position with associated candidates. Please reassign or delete candidates first." }, { status: 409 });
    }
    
    const deleteQuery = 'DELETE FROM "positions" WHERE id = $1';
    await getPool().query(deleteQuery, [id]);

    const redisClient = await getRedisClient();
    if (redisClient) {
        await redisClient.del(CACHE_KEY_POSITIONS);
    }
    
    await logAudit('AUDIT', `Position '${positionTitle}' (ID: ${id}) deleted.`, 'API:Positions', null, { targetPositionId: id, deletedPositionTitle: positionTitle });
    return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
  } catch (error: any) {
     console.error('Error in /api/positions/[id]:', error);
     await logAudit('ERROR', `Failed to delete position ${id}. Error: ${(error as Error).message}`, 'API:Positions', null, { targetPositionId: id });
     if (error.code === '23503') {
        return NextResponse.json({ message: "Cannot delete this position as it is still referenced by other entities (e.g., candidates)." }, { status: 409 });
     }
    return NextResponse.json({ message: "Error deleting position", error: error.message }, { status: 500 });
  }
}
