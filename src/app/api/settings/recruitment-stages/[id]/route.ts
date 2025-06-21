// src/app/api/settings/recruitment-stages/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '../../../../../lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import type { RecruitmentStage } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { getRedisClient, CACHE_KEY_RECRUITMENT_STAGES } from '@/lib/redis';

const updateRecruitmentStageSchema = z.object({
  name: z.string().min(1, 'Stage name cannot be empty.').optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/recruitment-stages\/([^/]+)/);
  return match ? match[1] : null;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const id = extractIdFromUrl(request);
    const session = await getServerSession();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT * FROM "RecruitmentStage" WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Recruitment stage not found" }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error(`Failed to fetch recruitment stage ${id}:`, error);
        return NextResponse.json({ message: "Error fetching recruitment stage", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(request: NextRequest) {
    const id = extractIdFromUrl(request);
    const session = await getServerSession();
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = updateRecruitmentStageSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    if (Object.keys(validation.data).length === 0) {
        return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const { name, description, sortOrder } = validation.data;
    
    const client = await getPool().connect();
    try {
        const setClauses = Object.entries(validation.data).map(([key, value], index) => {
            const dbKey = key === 'sortOrder' ? '"sortOrder"' : key;
            return `${dbKey} = $${index + 1}`;
        });
        const queryParams = Object.values(validation.data);
        
        const updateQuery = `
            UPDATE "RecruitmentStage"
            SET ${setClauses.join(', ')}, "updatedAt" = NOW()
            WHERE id = $${queryParams.length + 1}
            RETURNING *;
        `;

        const result = await client.query(updateQuery, [...queryParams, id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Recruitment stage not found" }, { status: 404 });
        }

        await logAudit('AUDIT', `Recruitment stage '${result.rows[0].name}' (ID: ${id}) updated.`, 'API:RecruitmentStages:Update', actingUserId, { stageId: id, changes: validation.data });
        return NextResponse.json(result.rows[0]);

    } catch (error: any) {
        console.error(`Failed to update recruitment stage ${id}:`, error);
        await logAudit('ERROR', `Failed to update stage (ID: ${id}). Error: ${error.message}`, 'API:RecruitmentStages:Update', actingUserId, { input: body });
        return NextResponse.json({ message: "Error updating recruitment stage", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(request: NextRequest) {
    const id = extractIdFromUrl(request);
    const session = await getServerSession();
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });
    
    const client = await getPool().connect();
    try {
        const result = await client.query('DELETE FROM "RecruitmentStage" WHERE id = $1 RETURNING name', [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Recruitment stage not found" }, { status: 404 });
        }
        
        await logAudit('AUDIT', `Recruitment stage '${result.rows[0].name}' (ID: ${id}) deleted.`, 'API:RecruitmentStages:Delete', actingUserId, { stageId: id });
        return NextResponse.json({ message: "Recruitment stage deleted successfully" });

    } catch (error: any) {
        console.error(`Failed to delete recruitment stage ${id}:`, error);
        await logAudit('ERROR', `Failed to delete stage (ID: ${id}). Error: ${error.message}`, 'API:RecruitmentStages:Delete', actingUserId);
        return NextResponse.json({ message: "Error deleting recruitment stage", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
