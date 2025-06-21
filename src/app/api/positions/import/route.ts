// src/app/api/positions/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';
// For actual Excel parsing, you would uncomment and use a library like 'xlsx'
// import * as XLSX from 'xlsx';

const importPositionItemSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  description: z.string().optional().nullable(),
  isOpen: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase();
        if (lowerVal === 'true') return true;
        if (lowerVal === 'false' || lowerVal === 'none') return false;
      }
      return val; // Pass through booleans
    },
    z.boolean({ required_error: "isOpen status is required (true/false)" })
  ),
  position_level: z.string().optional().nullable(),
});


// The overall input for the API is now a single file, not an array of positions
// The validation below will apply to each row extracted from the Excel file.

export async function POST(request: NextRequest) {
  const actingUserId = null; // Public API
  const actingUserName = 'System (Bulk Import)';
  let positionsToImport: any[];

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      await logAudit('ERROR', 'No file provided for position import.', 'API:Positions:Import', actingUserId);
      return NextResponse.json({ message: "No file provided in 'file' field." }, { status: 400 });
    }
    
    // Conceptual: Server-side Excel parsing
    // In a real implementation, you'd use a library like 'xlsx' (SheetJS) here.
    // const buffer = await file.arrayBuffer();
    // const workbook = XLSX.read(buffer, { type: 'buffer' });
    // const sheetName = workbook.SheetNames[0];
    // const worksheet = workbook.Sheets[sheetName];
    // const jsonData = XLSX.utils.sheet_to_json(worksheet);
    // positionsToImport = jsonData;

    // For this prototype, we'll assume the file contains a JSON array if not actually parsing Excel.
    // This part needs to be replaced with actual Excel parsing logic.
    // If you send JSON through FormData for testing:
    try {
        const fileContent = await file.text();
        positionsToImport = JSON.parse(fileContent);
         if (!Array.isArray(positionsToImport)) {
            throw new Error("Uploaded file content is not a valid JSON array.");
        }
    } catch (parseError) {
        await logAudit('ERROR', `Failed to parse uploaded file as JSON for position import (Excel parsing not implemented). Error: ${(parseError as Error).message}`, 'API:Positions:Import', actingUserId);
        return NextResponse.json({ message: "Invalid file content. Expected Excel (conceptual) or JSON array (for testing).", error: (parseError as Error).message }, { status: 400 });
    }
    // End of conceptual/testing block for file parsing

  } catch (error) {
    await logAudit('ERROR', `Failed to process form data for position import. Error: ${(error as Error).message}`, 'API:Positions:Import', actingUserId);
    return NextResponse.json({ message: "Error processing uploaded file", error: (error as Error).message }, { status: 400 });
  }

  const client = await pool.connect();
  let successfulImports = 0;
  let failedImports = 0;
  const errors: { itemIndex: number, title?: string, error: string | object }[] = [];

  try {
    for (let i = 0; i < positionsToImport.length; i++) {
      const item = positionsToImport[i];
      const validationResult = importPositionItemSchema.safeParse(item);

      if (!validationResult.success) {
        errors.push({ itemIndex: i, title: item.title, error: validationResult.error.flatten() });
        failedImports++;
        continue;
      }
      
      const validatedItem = validationResult.data;

      try {
        await client.query('BEGIN');
        const newPositionId = uuidv4();
        const insertQuery = `
          INSERT INTO "Position" (id, title, department, description, "isOpen", position_level, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `;
        await client.query(insertQuery, [
          newPositionId,
          validatedItem.title,
          validatedItem.department,
          validatedItem.description || null,
          validatedItem.isOpen,
          validatedItem.position_level || null,
        ]);
        await client.query('COMMIT');
        successfulImports++;
      } catch (itemError: any) {
        await client.query('ROLLBACK');
        errors.push({ itemIndex: i, title: validatedItem.title, error: itemError.message || "Failed to import this position." });
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
