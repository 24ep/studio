
import { NextResponse, type NextRequest } from 'next/server';
import { mockPositions } from '@/lib/data';
import type { Position } from '@/lib/types';

// In-memory store for this example, replace with database logic
let positionsStore: Position[] = JSON.parse(JSON.stringify(mockPositions)); // Deep copy

/**
 * @swagger
 * /api/positions/{id}:
 *   get:
 *     summary: Retrieve a specific position by ID
 *     description: Fetches details for a single job position.
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
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

/**
 * @swagger
 * /api/positions/{id}:
 *   put:
 *     summary: Update a job position
 *     description: Updates details for an existing job position.
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
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Replace with actual database update logic
  try {
    const body = await request.json();
    const positionIndex = positionsStore.findIndex(p => p.id === params.id);

    if (positionIndex === -1) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    let updatedPosition = { ...positionsStore[positionIndex] };

    if (body.title) updatedPosition.title = body.title;
    if (body.department) updatedPosition.department = body.department;
    if (body.description !== undefined) updatedPosition.description = body.description;
    if (typeof body.isOpen === 'boolean') updatedPosition.isOpen = body.isOpen;
    
    positionsStore[positionIndex] = updatedPosition;
    // TODO: Persist to PostgreSQL database here

    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error(`Failed to update position ${params.id}:`, error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid JSON payload", error: (error as Error).message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error updating position", error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     summary: Delete a job position
 *     description: Removes a job position from the system.
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
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
