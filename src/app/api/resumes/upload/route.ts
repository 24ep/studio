import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/resumes/upload:
 *   post:
 *     summary: Upload a resume
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Resume upload is not implemented yet." }, { status: 501 });
}
