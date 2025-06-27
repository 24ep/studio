// src/app/api/candidates/export/route.ts
import { NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

/**
 * @openapi
 * /api/candidates/export:
 *   get:
 *     summary: Export candidates
 *     description: Export all candidates.
 *     responses:
 *       200:
 *         description: Exported candidates data
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

export const dynamic = "force-dynamic";

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
    await logAudit('WARN', 'Unauthorized attempt to export candidates', 'API:Candidates:Export', null);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to export candidates
  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_EXPORT')) {
    await logAudit('WARN', `Forbidden attempt to export candidates by ${actingUserName}`, 'API:Candidates:Export', actingUserId);
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to export candidates' }, { status: 403 });
  }

  try {
    const client = await getPool().connect();
    const result = await client.query('SELECT * FROM "Candidate" ORDER BY "createdAt" DESC');
    client.release();

    const csvData = convertToCsv(result.rows);
    
    await logAudit('AUDIT', `Candidates exported by ${actingUserName}. ${result.rows.length} candidates exported.`, 'API:Candidates:Export', actingUserId, { 
      exportCount: result.rows.length,
      format: 'CSV' 
    });

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="candidates-export.csv"',
      },
    });
  } catch (error) {
    await logAudit('ERROR', `Failed to export candidates by ${actingUserName}. Error: ${(error as Error).message}`, 'API:Candidates:Export', actingUserId, { 
      error: (error as Error).message 
    });
    return NextResponse.json({ error: 'Failed to export candidates' }, { status: 500 });
  }
}

    