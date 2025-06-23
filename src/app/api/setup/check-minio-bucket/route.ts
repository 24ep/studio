// src/app/api/setup/check-minio-bucket/route.ts
// This API route is no longer used as the setup page is being removed.
import { NextResponse } from 'next/server';

/**
 * @openapi
 * /api/setup/check-minio-bucket:
 *   get:
 *     summary: Check MinIO bucket
 *     responses:
 *       410:
 *         description: This endpoint is deprecated as the setup page has been removed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ message: "This endpoint is deprecated as the setup page has been removed." }, { status: 410 });
}
