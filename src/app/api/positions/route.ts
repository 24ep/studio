
import { NextResponse, type NextRequest } from 'next/server';
import { mockPositions } from '@/lib/data';
import type { Position } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// In-memory store for this example, replace with database logic
let positionsStore: Position[] = JSON.parse(JSON.stringify(mockPositions)); // Deep copy for mutation

/**
 * @swagger
 * /api/positions:
 *   get:
 *     summary: Retrieve a list of job positions
 *     description: Fetches all job positions. Supports filtering by title or department. Requires authentication.
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter positions by title (case-insensitive, partial match).
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter positions by department (case-insensitive, partial match).
 *     responses:
 *       200:
 *         description: A list of positions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Position'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // TODO: Replace with actual database query
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const department = searchParams.get('department');

    let filteredPositions = [...positionsStore];

    if (title) {
      filteredPositions = filteredPositions.filter(p => 
        p.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    if (department) {
      filteredPositions = filteredPositions.filter(p =>
        p.department.toLowerCase().includes(department.toLowerCase())
      );
    }
    
    return NextResponse.json(filteredPositions, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json({ message: "Error fetching positions", error: (error as Error).message }, { status: 500 });
  }
}

// Zod schema for creating a new position
const createPositionSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  description: z.string().optional(),
  isOpen: z.boolean({ required_error: "isOpen status is required" }),
});

/**
 * @swagger
 * /api/positions:
 *   post:
 *     summary: Create a new job position
 *     description: Adds a new job position to the system. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior Developer"
 *               department:
 *                 type: string
 *                 example: "Technology"
 *               description:
 *                 type: string
 *                 example: "Lead development of new features."
 *               isOpen:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - title
 *               - department
 *               - isOpen
 *     responses:
 *       201:
 *         description: Position created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Position'
 *       400:
 *         description: Invalid input or missing required fields.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid JSON payload", error: error.message }, { status: 400 });
    }
    console.error("Error parsing JSON body for new position:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 500 });
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
    const newPosition: Position = {
      id: `pos${Date.now()}`, // Simple ID generation
      title: validatedData.title,
      department: validatedData.department,
      description: validatedData.description || '',
      isOpen: validatedData.isOpen,
    };

    positionsStore.push(newPosition);
    // TODO: Persist to PostgreSQL database here

    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error("Failed to create position:", error);
    return NextResponse.json({ message: "Error creating position", error: (error as Error).message }, { status: 500 });
  }
}
