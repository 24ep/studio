
// src/app/api/positions/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';
// No session needed for public API

const importPositionItemSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  description: z.string().optional().nullable(),
  isOpen: z.boolean({ required_error: "isOpen status is required" }),
  position_level: z.string().optional().nullable(),
});

const importPositionsSchema = z.array(importPositionItemSchema);

export async function POST(request: NextRequest) {
  const actingUserId = null; // Public API
  const actingUserName = 'System (Bulk Import)';

  let body;
  try {
    body = await request.json();
  } catch (error) {
    await logAudit('ERROR', `Failed to parse JSON body for position import. Error: ${(error as Error).message}`, 'API:Positions:Import', actingUserId);
    return NextResponse.json({ message: "Invalid JSON payload", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = importPositionsSchema.safeParse(body);
  if (!validationResult.success) {
    await logAudit('ERROR', `Invalid input for position import. Errors: ${JSON.stringify(validationResult.error.flatten())}`, 'API:Positions:Import', actingUserId);
    return NextResponse.json(
      { message: "Invalid input for position import", errors: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  const positionsToImport = validationResult.data;
  const client = await pool.connect();
  let successfulImports = 0;
  let failedImports = 0;
  const errors: { itemIndex: number, title?: string, error: string }[] = [];

  try {
    for (let i = 0; i < positionsToImport.length; i++) {
      const item = positionsToImport[i];
      try {
        // For positions, we might allow duplicates or update existing ones based on title.
        // For simplicity, this example will just insert. Add duplicate checks if needed.
        // Consider adding ON CONFLICT DO NOTHING or DO UPDATE if titles should be unique.
        await client.query('BEGIN');
        const newPositionId = uuidv4();
        const insertQuery = `
          INSERT INTO "Position" (id, title, department, description, "isOpen", position_level, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `;
        await client.query(insertQuery, [
          newPositionId,
          item.title,
          item.department,
          item.description || null,
          item.isOpen,
          item.position_level || null,
        ]);
        await client.query('COMMIT');
        successfulImports++;
      } catch (itemError: any) {
        await client.query('ROLLBACK');
        errors.push({ itemIndex: i, title: item.title, error: itemError.message || "Failed to import this position." });
        failedImports++;
      }
    }

    await logAudit('AUDIT', `Position import completed. Successful: ${successfulImports}, Failed: ${failedImports}.`, 'API:Positions:Import', actingUserId, { successfulImports, failedImports, errors });
    return NextResponse.json({
      message: "Position import process finished.",
      successfulImports,
      failedImports,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 200 });

  } catch (error) {
    // This catch is for errors outside the loop
    await logAudit('ERROR', `Critical error during position import process: ${(error as Error).message}`, 'API:Positions:Import', actingUserId);
    return NextResponse.json({ message: "Error processing position import", error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
}
