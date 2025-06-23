// src/app/api/positions/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/positions/import:
 *   post:
 *     summary: Import positions in bulk
 *     description: Import multiple positions at once. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Position'
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 - title: "Software Engineer"
 *                   department: "Engineering"
 *                   isOpen: true
 *                   position_level: "mid level"
 *     responses:
 *       201:
 *         description: Import completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   message: "Import completed"
 *                   results:
 *                     - success: true
 *                       position:
 *                         id: "uuid"
 *                         title: "Software Engineer"
 *                         department: "Engineering"
 *                         isOpen: true
 *                         position_level: "mid level"
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all imported positions
 *     description: Returns all imported positions. Requires authentication.
 *     responses:
 *       200:
 *         description: List of imported positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Position'
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   data:
 *                     - id: "uuid"
 *                       title: "Software Engineer"
 *                       department: "Engineering"
 *                       isOpen: true
 *                       position_level: "mid level"
 */

// Zod schema for position import
const importPositionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isOpen: z.boolean().optional(),
  position_level: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ message: "Expected an array of positions" }, { status: 400 });
  }

  const client = await getPool().connect();
  const results = [];
  try {
    await client.query('BEGIN');
    for (const item of body) {
      const validationResult = importPositionSchema.safeParse(item);
      if (!validationResult.success) {
        results.push({ error: validationResult.error.flatten().fieldErrors, item });
        continue;
      }
      const { title, department, description, isOpen, position_level } = validationResult.data;
      const newPositionId = uuidv4();
      try {
        const insertQuery = `
          INSERT INTO "positions" (id, title, department, description, "isOpen", position_level, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING *;
        `;
        const result = await client.query(insertQuery, [
          newPositionId, title, department, description, isOpen ?? true, position_level
        ]);
        results.push({ success: true, position: result.rows[0] });
      } catch (error: any) {
        results.push({ error: error.message, item });
      }
    }
    await client.query('COMMIT');
    return NextResponse.json({ message: "Import completed", results }, { status: 201 });
  } catch (error: any) {
    console.error('Error in /api/positions/import:', error);
    await client.query('ROLLBACK');
    return NextResponse.json({ message: 'Error importing positions', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const client = await getPool().connect();
  try {
    const positionsQuery = `
      SELECT * FROM "positions"
      ORDER BY "createdAt" DESC;
    `;
    const positionsResult = await client.query(positionsQuery);
    return NextResponse.json({
      data: positionsResult.rows
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/positions/import:', error);
    return NextResponse.json({ message: 'Error fetching positions', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
