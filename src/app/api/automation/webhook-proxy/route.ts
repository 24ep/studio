// src/app/api/automation/webhook-proxy/route.ts
import { NextResponse } from 'next/server';

/**
 * @openapi
 * /api/automation/webhook-proxy:
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

    