// src/app/api/candidates/export/route.ts
import { NextResponse } from 'next/server';
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
export async function GET() {
    return NextResponse.json({ ok: true });
}
