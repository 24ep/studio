// src/app/api/settings/recruitment-stages/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '../../../../lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { deleteCache, CACHE_KEY_RECRUITMENT_STAGES } from '@/lib/redis';
export const dynamic = "force-dynamic";
const recruitmentStageSchema = z.object({
    name: z.string().min(1, 'Stage name cannot be empty.'),
    description: z.string().optional().nullable(),
    sort_order: z.number().int().optional(),
});
/**
 * @openapi
 * /api/settings/recruitment-stages:
 *   get:
 *     summary: Get all recruitment stages
 *     description: Returns all recruitment stages. Requires authentication.
 *     responses:
 *       200:
 *         description: List of recruitment stages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new recruitment stage
 *     description: Creates a new recruitment stage. Requires authentication and Admin or RECRUITMENT_STAGES_MANAGE permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               is_system:
 *                 type: boolean
 *               sort_order:
 *                 type: integer
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 name: "Screening"
 *                 description: "Screening stage"
 *                 is_system: false
 *                 sort_order: 2
 *     responses:
 *       201:
 *         description: Recruitment stage created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   id: "uuid"
 *                   name: "Screening"
 *                   description: "Screening stage"
 *                   is_system: false
 *                   sort_order: 2
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden: Insufficient permissions
 *       500:
 *         description: Server error
 */
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return new NextResponse('Unauthorized', { status: 401 });
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
        return NextResponse.json(result.rows);
    }
    catch (error) {
        console.error("Failed to fetch recruitment stages:", error);
        return NextResponse.json({ message: "Error fetching recruitment stages", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
export async function POST(request) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId)
        return new NextResponse('Unauthorized', { status: 401 });
    let body;
    try {
        body = await request.json();
    }
    catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    const validation = recruitmentStageSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { name, description, sort_order } = validation.data;
    const newId = uuidv4();
    const client = await getPool().connect();
    try {
        const result = await client.query('INSERT INTO "RecruitmentStage" (id, name, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *', [newId, name, description, sort_order ?? 0]);
        await logAudit('AUDIT', `Recruitment stage '${name}' created.`, 'API:RecruitmentStages:Create', actingUserId, { stageId: newId });
        await deleteCache(CACHE_KEY_RECRUITMENT_STAGES);
        return NextResponse.json(result.rows[0], { status: 201 });
    }
    catch (error) {
        console.error("Failed to create recruitment stage:", error);
        await logAudit('ERROR', `Failed to create stage '${name}'. Error: ${error.message}`, 'API:RecruitmentStages:Create', actingUserId, { input: body });
        return NextResponse.json({ message: "Error creating recruitment stage", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
