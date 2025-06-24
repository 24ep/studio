// src/app/api/n8n/webhook-proxy/route.ts
import { NextResponse } from 'next/server';
/**
 * @openapi
 * /api/n8n/webhook-proxy:
 *   get:
 *     summary: Check webhook proxy
 *     responses:
 *       200:
 *         description: Webhook proxy status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 */
export const dynamic = "force-dynamic";
export async function GET() {
    return NextResponse.json({ ok: true });
}
