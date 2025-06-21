// src/app/api/positions/export/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
// For actual Excel generation, you would use a library like 'xlsx'
// import * as XLSX from 'xlsx';

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


export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    // Implement filtering based on query params if needed for export
    // Example: const titleFilter = searchParams.get('title');

    const query = `
      SELECT
        id, title, department, description, "isOpen", position_level, "createdAt", "updatedAt"
      FROM "Position"
      ORDER BY "createdAt" DESC;
    `;
    // Add WHERE clause here if implementing filters

    const result = await pool.query(query);
    const positions = result.rows;

    // Conceptual: Generate Excel file using a library like 'xlsx'
    // const worksheet = XLSX.utils.json_to_sheet(positions);
    // const workbook = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(workbook, worksheet, "Positions");
    // const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    //
    // return new NextResponse(excelBuffer, {
    //   status: 200,
    //   headers: {
    //     'Content-Disposition': `attachment; filename="positions_export.xlsx"`,
    //     'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    //   },
    // });

    // Fallback: Return as CSV (simpler for this prototype without adding new libraries)
    const csvData = convertToCsv(positions);
    await logAudit('AUDIT', `User ${session.user.name} (ID: ${session.user.id}) exported ${positions.length} positions.`, 'API:Positions:Export', session.user.id);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="positions_export.csv"`,
        'Content-Type': 'text/csv',
      },
    });

  } catch (error) {
    console.error("Failed to export positions:", error);
    await logAudit('ERROR', `Failed to export positions by ${session.user.name}. Error: ${(error as Error).message}`, 'API:Positions:Export', session.user.id);
    return NextResponse.json({ message: "Error exporting positions", error: (error as Error).message }, { status: 500 });
  }
}
