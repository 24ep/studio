// src/app/api/positions/export/route.ts
import { NextResponse } from 'next/server';
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
function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}
function convertToCsv(data) {
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
    return NextResponse.json({ ok: true });
}
