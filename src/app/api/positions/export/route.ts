// src/app/api/positions/export/route.ts
import { NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
// For actual Excel generation, you would use a library like 'xlsx'
// import * as XLSX from 'xlsx';

export const dynamic = "force-dynamic";

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

// Helper function to convert JSON object to CSV row
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (stringValue.includes(',')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function convertToCsv(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.map(escapeCsvValue).join(','));

  for (const row of data) {
    const values = headers.map(header => escapeCsvValue(row[header]));
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id;
  const actingUserName = session?.user?.name || session?.user?.email || 'System';

  if (!actingUserId) {
    await logAudit('WARN', 'Unauthorized attempt to export positions', 'API:Positions:Export', null);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to export positions
  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('POSITIONS_EXPORT')) {
    await logAudit('WARN', `Forbidden attempt to export positions by ${actingUserName}`, 'API:Positions:Export', actingUserId);
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to export positions' }, { status: 403 });
  }

  try {
    const client = await getPool().connect();
    const result = await client.query('SELECT * FROM "Position" ORDER BY "createdAt" DESC');
    client.release();

    const csvData = convertToCsv(result.rows);
    
    await logAudit('AUDIT', `Positions exported by ${actingUserName}. ${result.rows.length} positions exported.`, 'API:Positions:Export', actingUserId, { 
      exportCount: result.rows.length,
      format: 'CSV' 
    });

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="positions-export.csv"',
      },
    });
  } catch (error) {
    await logAudit('ERROR', `Failed to export positions by ${actingUserName}. Error: ${(error as Error).message}`, 'API:Positions:Export', actingUserId, { 
      error: (error as Error).message 
    });
    return NextResponse.json({ error: 'Failed to export positions' }, { status: 500 });
  }
}
