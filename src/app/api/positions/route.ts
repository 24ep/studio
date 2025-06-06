
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
// import { getServerSession } from 'next-auth/next'; // No longer needed for public API
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // No longer needed for public API
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  // const session = await getServerSession(authOptions);
  // if (!session?.user) {
  //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // }

  try {
    const { searchParams } = new URL(request.url);
    const titleFilter = searchParams.get('title');
    const departmentFilter = searchParams.get('department');
    const isOpenFilter = searchParams.get('isOpen'); // "true", "false", or null
    const positionLevelFilter = searchParams.get('position_level');


    let query = 'SELECT * FROM "Position"';
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (titleFilter) {
      conditions.push(`title ILIKE $${paramIndex++}`);
      queryParams.push(`%${titleFilter}%`);
    }
    if (departmentFilter) {
      conditions.push(`department ILIKE $${paramIndex++}`);
      queryParams.push(`%${departmentFilter}%`);
    }
    if (isOpenFilter === "true") {
      conditions.push(`"isOpen" = TRUE`);
    } else if (isOpenFilter === "false") {
      conditions.push(`"isOpen" = FALSE`);
    }
    if (positionLevelFilter) {
      conditions.push(`position_level ILIKE $${paramIndex++}`);
      queryParams.push(`%${positionLevelFilter}%`);
    }


    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "createdAt" DESC';
    
    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    await logAudit('ERROR', `Failed to fetch positions. Error: ${(error as Error).message}`, 'API:Positions:GetAll', null);
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
  // const session = await getServerSession(authOptions);
  // const userRole = session?.user?.role;

  // if (!session?.user || (userRole !== 'Admin' && userRole !== 'Recruiter')) {
  //   await logAudit('WARN', `Forbidden attempt to create position by user ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required roles: Admin, Recruiter.`, 'API:Positions:Create', session?.user?.id);
  //   return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  // }
  const actingUserId = null; // Public API
  const actingUserName = 'System (Public API)';


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
    const newPositionId = uuidv4();
    const insertQuery = `
      INSERT INTO "Position" (id, title, department, description, "isOpen", position_level, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *;
    `;
    const values = [
      newPositionId,
      validatedData.title,
      validatedData.department,
      validatedData.description || null,
      validatedData.isOpen,
      validatedData.position_level || null,
    ];
    const result = await pool.query(insertQuery, values);
    const newPosition = result.rows[0];

    await logAudit('AUDIT', `Position '${newPosition.title}' (ID: ${newPosition.id}) created by ${actingUserName}.`, 'API:Positions:Create', actingUserId, { targetPositionId: newPosition.id, title: newPosition.title, department: newPosition.department, position_level: newPosition.position_level });
    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error("Failed to create position:", error);
    await logAudit('ERROR', `Failed to create position '${validatedData.title}' by ${actingUserName}. Error: ${(error as Error).message}`, 'API:Positions:Create', actingUserId, { title: validatedData.title });
    return NextResponse.json({ message: "Error creating position", error: (error as Error).message }, { status: 500 });
  }
}
