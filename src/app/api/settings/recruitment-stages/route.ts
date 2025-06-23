// src/app/api/settings/recruitment-stages/route.ts
import { NextResponse, type NextRequest } from 'next/server';
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
 *     responses:
 *       200:
 *         description: List of recruitment stages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new recruitment stage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Recruitment stage created
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error("Failed to fetch recruitment stages:", error);
        return NextResponse.json({ message: "Error fetching recruitment stages", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}


export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch (e) {
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
        const result = await client.query(
            'INSERT INTO "RecruitmentStage" (id, name, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
            [newId, name, description, sort_order ?? 0]
        );
        await logAudit('AUDIT', `Recruitment stage '${name}' created.`, 'API:RecruitmentStages:Create', actingUserId, { stageId: newId });
        await deleteCache(CACHE_KEY_RECRUITMENT_STAGES);
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Failed to create recruitment stage:", error);
        await logAudit('ERROR', `Failed to create stage '${name}'. Error: ${error.message}`, 'API:RecruitmentStages:Create', actingUserId, { input: body });
        return NextResponse.json({ message: "Error creating recruitment stage", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
    
