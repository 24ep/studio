
import { NextResponse, type NextRequest } from 'next/server';
import { mockPositions } from '@/lib/data';
import type { Position } from '@/lib/types';

// In-memory store for this example, replace with database logic
let positionsStore: Position[] = JSON.parse(JSON.stringify(mockPositions)); // Deep copy for mutation

/**
 * @swagger
 * /api/positions:
 *   get:
 *     summary: Retrieve a list of job positions
 *     description: Fetches all job positions. Supports filtering by title or department.
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
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: NextRequest) {
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

/**
 * @swagger
 * /api/positions:
 *   post:
 *     summary: Create a new job position
 *     description: Adds a new job position to the system.
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
 *       500:
 *         description: Internal server error.
 */
export async function POST(request: NextRequest) {
  // TODO: Replace with actual database insertion and validation
  try {
    const body = await request.json();

    if (!body.title || !body.department || typeof body.isOpen !== 'boolean') {
      return NextResponse.json({ message: "Missing required fields (title, department, isOpen)" }, { status: 400 });
    }

    const newPosition: Position = {
      id: `pos${Date.now()}`, // Simple ID generation
      title: body.title,
      department: body.department,
      description: body.description || '',
      isOpen: body.isOpen,
    };

    positionsStore.push(newPosition);
    // TODO: Persist to PostgreSQL database here

    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error("Failed to create position:", error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid JSON payload", error: (error as Error).message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error creating position", error: (error as Error).message }, { status: 500 });
  }
}
