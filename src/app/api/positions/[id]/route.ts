
import { NextResponse, type NextRequest } from 'next/server';
import { mockPositions } from '@/lib/data';
import type { Position } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// In-memory store for this example, replace with database logic
let positionsStore: Position[] = JSON.parse(JSON.stringify(mockPositions)); // Deep copy

/**
 * @swagger
 * /api/positions/{id}:
 *   get:
 *     summary: Retrieve a specific position by ID
 *     description: Fetches details for a single job position. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the position to retrieve.
 *     responses:
 *       200:
 *         description: Position details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Position'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // TODO: Replace with actual database query
  try {
    const position = positionsStore.find(p => p.id === params.id);
    if (!position) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    return NextResponse.json(position, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch position ${params.id}:`, error);
    return NextResponse.json({ message: "Error fetching position", error: (error as Error).message }, { status: 500 });
  }
}

// Zod schema for updating a position (all fields optional)
const updatePositionSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }).optional(),
  department: z.string().min(1, { message: "Department cannot be empty" }).optional(),
  description: z.string().optional(),
  isOpen: z.boolean().optional(),
});

/**
 * @swagger
 * /api/positions/{id}:
 *   put:
 *     summary: Update a job position
 *     description: Updates details for an existing job position. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the position to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               description:
 *                 type: string
 *               isOpen:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Position updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Position'
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    console.error(`Error parsing JSON body for updating position ${params.id}:`, error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 500 });
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
    const positionIndex = positionsStore.findIndex(p => p.id === params.id);

    if (positionIndex === -1) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    let updatedPosition = { ...positionsStore[positionIndex] };

    if (validatedData.title) updatedPosition.title = validatedData.title;
    if (validatedData.department) updatedPosition.department = validatedData.department;
    if (validatedData.description !== undefined) updatedPosition.description = validatedData.description;
    if (typeof validatedData.isOpen === 'boolean') updatedPosition.isOpen = validatedData.isOpen;
    
    positionsStore[positionIndex] = updatedPosition;
    // TODO: Persist to PostgreSQL database here

    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error(`Failed to update position ${params.id}:`, error);
    return NextResponse.json({ message: "Error updating position", error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     summary: Delete a job position
 *     description: Removes a job position from the system. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the position to delete.
 *     responses:
 *       200:
 *         description: Position deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // TODO: Replace with actual database deletion logic
  try {
    const initialLength = positionsStore.length;
    positionsStore = positionsStore.filter(p => p.id !== params.id);

    if (positionsStore.length === initialLength) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    
    // TODO: Persist to PostgreSQL database here
    
    return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete position ${params.id}:`, error);
    return NextResponse.json({ message: "Error deleting position", error: (error as Error).message }, { status: 500 });
  }
}
