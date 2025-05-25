
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const department = searchParams.get('department');

    let query = 'SELECT * FROM "Position"';
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (title) {
      conditions.push(`title ILIKE $${paramIndex++}`);
      queryParams.push(`%${title}%`);
    }
    if (department) {
      conditions.push(`department ILIKE $${paramIndex++}`);
      queryParams.push(`%${department}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "createdAt" DESC';
    
    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    await logAudit('ERROR', `Failed to fetch positions. Error: ${(error as Error).message}`, 'API:Positions', null);
    return NextResponse.json({ message: "Error fetching positions", error: (error as Error).message }, { status: 500 });
  }
}

const createPositionSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  description: z.string().optional().nullable(),
  isOpen: z.boolean({ required_error: "isOpen status is required" }),
  position_level: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body for new position:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = createPositionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  
  const validatedData = validationResult.data;

  try {
    const insertQuery = `
      INSERT INTO "Position" (title, department, description, "isOpen", position_level, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *;
    `;
    const values = [
      validatedData.title,
      validatedData.department,
      validatedData.description || null,
      validatedData.isOpen,
      validatedData.position_level || null,
    ];
    const result = await pool.query(insertQuery, values);
    const newPosition = result.rows[0];

    await logAudit('AUDIT', `Position '${newPosition.title}' (ID: ${newPosition.id}) created.`, 'API:Positions', null, { targetPositionId: newPosition.id, title: newPosition.title, department: newPosition.department, position_level: newPosition.position_level });
    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error("Failed to create position:", error);
    await logAudit('ERROR', `Failed to create position '${validatedData.title}'. Error: ${(error as Error).message}`, 'API:Positions', null, { title: validatedData.title });
    return NextResponse.json({ message: "Error creating position", error: (error as Error).message }, { status: 500 });
  }
}

    