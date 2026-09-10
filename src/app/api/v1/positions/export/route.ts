export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: handleCors(req) });
  }

  if (user.role !== 'Admin' &&  !user.modulePermissions?.includes('POSITIONS_EXPORT')) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to export positions' }), { status: 403, headers: handleCors(req) });
  }

  const client = await getPool().connect();
  try {
    const query = `
      SELECT p.id, p.title, p.department, p.description, p."matchCriteria", p."isOpen", p."positionLevel", p."customAttributes", p."createdAt", p."updatedAt", u.name as "recruiterName", u.email as "recruiterEmail"
      FROM "Position" p
      LEFT JOIN "User" u ON p."recruiterId" = u.id
      ORDER BY p."createdAt" DESC
    `;
    const result = await client.query(query);
    
    // Convert to CSV format
    const headers = [
      'ID', 'Title', 'Department', 'Description', 'Match Criteria', 'Is Open', 'Position Level', 
      'Recruiter Name', 'Recruiter Email', 'Created At', 'Updated At'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const row of result.rows) {
      const csvRow = [
        row.id,
        `"${(row.title || '').replace(/"/g, '""')}"`,
        `"${(row.department || '').replace(/"/g, '""')}"`,
        `"${(row.description || '').replace(/"/g, '""')}"`,
        `"${(row.matchCriteria || '').replace(/"/g, '""')}"`,
        row.isOpen ? 'true' : 'false',
        `"${(row.positionLevel || '').replace(/"/g, '""')}"`,
        `"${(row.recruiterName || '').replace(/"/g, '""')}"`,
        `"${(row.recruiterEmail || '').replace(/"/g, '""')}"`,
        row.createdAt || '',
        row.updatedAt || ''
      ];
      csvRows.push(csvRow.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...handleCors(req),
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="positions-export.csv"'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error exporting positions', details: (error as Error).message }), { status: 500, headers: handleCors(req) });
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 
