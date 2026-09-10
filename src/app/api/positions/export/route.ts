export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// src/app/api/positions/export/route.ts
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool, type DbClient } from '@/lib/db';
import ExcelJS from 'exceljs';
import { logAudit } from '@/lib/auditLog';
import { getSystemSetting } from '@/lib/systemSettings';

import { auth } from '@/auth';
/**
 * @openapi
 * /api/positions/export:
 *   get:
 *     summary: Export positions
 *     description: Export all positions.
 *     responses:
 *       200:
 *         description: Exported positions data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   ok: true
 */

type PositionExportRow = Record<string, unknown>;
type CleanExcelRow = Record<string, string | number>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatExcelValue(value: unknown): string | number {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return value.includes('<') ? value.replace(/<[^>]*>/g, '').trim() : value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Helper function to convert data to Excel format
async function convertToExcel(data: PositionExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Positions');

  if (!data || data.length === 0) {
    // Create empty workbook with headers if possible, but here just empty
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Clean and format the data for Excel
  const cleanedData = data.map(row => {
    const cleanedRow: CleanExcelRow = {};
    Object.keys(row).forEach(key => {
      cleanedRow[key] = formatExcelValue(row[key]);
    });
    return cleanedRow;
  });

  // Auto-size columns based on headers and content
  // Since we rely on dynamic keys, let's set columns from the first row keys
  if (cleanedData.length > 0) {
    const headers = Object.keys(cleanedData[0]);
    worksheet.columns = headers.map(header => ({
      header: header,
      key: header,
      width: Math.max(header.length, 15) // Minimum width of 15 characters
    }));
  }

  // Add rows
  worksheet.addRows(cleanedData);

  // Generate Excel file as buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function GET() {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    await logAudit('WARN', 'Unauthorized attempt to export positions', 'API:Positions:Export', null);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to export positions
  if (!session?.user || !hasPermission(session.user, 'POSITIONS_EXPORT')) {
    await logAudit('WARN', `Forbidden attempt to export positions by ${actingUserName}`, 'API:Positions:Export', actingUserId);
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to export positions' }, { status: 403 });
  }

  if (await getSystemSetting('exportImportFeatureEnabled') === 'false') {
    return NextResponse.json({ error: 'Export/Import feature is disabled' }, { status: 403 });
  }

  let client: DbClient | null = null;
  try {
    client = await getPool().connect();
    const result = await client.query('SELECT * FROM "Position" ORDER BY "createdAt" DESC');

    const excelBuffer = await convertToExcel(result.rows);

    await logAudit('AUDIT', `Positions exported by ${actingUserName}. ${result.rows.length} positions exported.`, 'API:Positions:Export', actingUserId, {
      exportCount: result.rows.length,
      format: 'Excel'
    });

    // Wrap Buffer for Web Response body
    const body = new Uint8Array(excelBuffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="positions-export.xlsx"',
      },
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    await logAudit('ERROR', `Failed to export positions by ${actingUserName}. Error: ${errorMessage}`, 'API:Positions:Export', actingUserId, {
      error: errorMessage
    });
    return NextResponse.json({ error: 'Failed to export positions' }, { status: 500 });
  } finally {
    // ? CRITICAL FIX: Always release the database client
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database client:', releaseError);
      }
    }
  }
}
