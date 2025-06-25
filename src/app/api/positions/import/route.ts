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
 *   post:
 *     summary: Bulk import positions
 *     description: Import multiple positions at once. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Position'
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
  const actingUserId = session?.user?.id;
  const actingUserName = session?.user?.name || session?.user?.email || 'System';

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = importPositionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const { positions } = validationResult.data;

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const position of positions) {
      try {
        // Check if position already exists (by title and department)
        const existingResult = await client.query('SELECT id FROM "Position" WHERE title = $1 AND department = $2', [position.title, position.department]);
        if (existingResult.rows.length > 0) {
          results.failed++;
          results.errors.push(`Position with title "${position.title}" in department "${position.department}" already exists`);
          continue;
        }

        // Insert position
        const insertQuery = `
          INSERT INTO "Position" (id, title, department, description, "isOpen", position_level, "customAttributes", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *;
        `;
        const positionId = uuidv4();
        await client.query(insertQuery, [
          positionId, position.title, position.department, position.description, 
          position.isOpen, position.position_level, position.custom_attributes || {}
        ]);

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to import ${position.title}: ${error.message}`);
      }
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `Bulk import completed by ${actingUserName}. Success: ${results.success}, Failed: ${results.failed}`, 'API:Positions:Import', actingUserId, { results });

    return NextResponse.json({
      message: 'Import completed',
      ...results
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    await logAudit('ERROR', `Bulk import failed. Error: ${error.message}`, 'API:Positions:Import', actingUserId, { input: body });
    return NextResponse.json({ message: 'Error during import', error: error.message }, { status: 500 });
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
