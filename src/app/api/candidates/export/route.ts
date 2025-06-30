// src/app/api/candidates/export/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import type { Candidate, CandidateDetails, Position, UserProfile } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
// For actual Excel generation, you would use a library like 'xlsx'
// import * as XLSX from 'xlsx';

// Helper function to convert JSON object to CSV row
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
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


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // Add permission check if needed, e.g., only Admins or Recruiters can export
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    // You can implement filtering based on query params similar to GET /api/candidates
    // For simplicity, this example exports all candidates.
    // Example: const nameFilter = searchParams.get('name');

    const query = `
      SELECT
        c.id, c.name, c.email, c.phone, c."resumePath",
        c."positionId", p.title as "positionTitle",
        c."fitScore", c.status, c."applicationDate",
        c."recruiterId", rec.name as "recruiterName",
        c."createdAt", c."updatedAt",
        c."parsedData" -- Include parsedData as JSON string
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" rec ON c."recruiterId" = rec.id
      ORDER BY c."createdAt" DESC;
    `;
    // Add WHERE clause here if implementing filters

    const result = await pool.query(query);
    const candidates = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        resumePath: row.resumePath,
        positionId: row.positionId,
        positionTitle: row.positionTitle,
        fitScore: row.fitScore,
        status: row.status,
        applicationDate: row.applicationDate,
        recruiterId: row.recruiterId,
        recruiterName: row.recruiterName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        // Convert parsedData to a string for easier CSV/Excel cell handling
        parsedData: row.parsedData ? JSON.stringify(row.parsedData) : null,
    }));

    // Conceptual: Generate Excel file using a library like 'xlsx'
    // const worksheet = XLSX.utils.json_to_sheet(candidates);
    // const workbook = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    // const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    //
    // return new NextResponse(excelBuffer, {
    //   status: 200,
    //   headers: {
    //     'Content-Disposition': `attachment; filename="candidates_export.xlsx"`,
    //     'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    //   },
    // });

    // Fallback: Return as CSV (simpler for this prototype without adding new libraries)
    const csvData = convertToCsv(candidates);
    await logAudit('AUDIT', `User ${session.user.name} (ID: ${session.user.id}) exported ${candidates.length} candidates.`, 'API:Candidates:Export', session.user.id);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="candidates_export.csv"`,
        'Content-Type': 'text/csv',
      },
    });

  } catch (error) {
    console.error("Failed to export candidates:", error);
    await logAudit('ERROR', `Failed to export candidates by ${session.user.name}. Error: ${(error as Error).message}`, 'API:Candidates:Export', session.user.id);
    return NextResponse.json({ message: "Error exporting candidates", error: (error as Error).message }, { status: 500 });
  }
}

    