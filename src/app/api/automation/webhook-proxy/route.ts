// src/app/api/automation/webhook-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAutomationApiKey } from '@/lib/api-route-guards';

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

export async function GET(request: NextRequest) {
  const authError = requireAutomationApiKey(request);
  if (authError) return authError;

  return NextResponse.json({ ok: true });
}

    
