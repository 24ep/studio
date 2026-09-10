import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// src/app/api/settings/recruitment-stages/[id]/migrate/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '../../../../../../lib/db';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/recruitment-stages\/([^/]+)\/migrate/);
  return match ? match[1] : null;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
    const id = extractIdFromUrl(request);
    if (!id) {
        return NextResponse.json({ message: "Invalid recruitment stage ID" }, { status: 400 });
    }
    
    // SECURITY: Validate UUID format to prevent injection attacks
    const { validateUuid } = await import('@/lib/security');
    if (!validateUuid(id)) {
        console.error('[SECURITY] Invalid UUID format in recruitment-stages migrate POST request:', id);
        return NextResponse.json({ message: "Invalid recruitment stage ID format" }, { status: 400 });
    }
    
    const session = await auth();
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });
    
    // Check permissions
    if (!hasPermission(session.user, 'RECRUITMENT_STAGES_EDIT')) {
        await logAudit('WARN', `Forbidden attempt to migrate recruitment stage by ${session.user.name || session.user.email}.`, 'API:RecruitmentStages:Migrate', actingUserId);
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const body = bodyResult.value;
    const replacementStageName = isRecord(body) && typeof body.replacementStageName === 'string'
        ? body.replacementStageName
        : '';
    if (!replacementStageName) {
        return NextResponse.json({ message: 'Replacement stage name is required' }, { status: 400 });
    }
    
    const client = await getPool().connect();
    try {
        // Get the stage to be migrated
        const stageResult = await client.query('SELECT id, name FROM "RecruitmentStage" WHERE id = $1', [id]);
        if (stageResult.rowCount === 0) {
            return NextResponse.json({ message: "Recruitment stage not found" }, { status: 404 });
        }
        
        const stageId = stageResult.rows[0].id;
        const stageName = stageResult.rows[0].name;
        
        // Verify the replacement stage exists and get its ID
        const replacementStageResult = await client.query('SELECT id, name FROM "RecruitmentStage" WHERE name = $1', [replacementStageName]);
        if (replacementStageResult.rowCount === 0) {
            return NextResponse.json({ message: `Replacement stage "${replacementStageName}" not found` }, { status: 404 });
        }
        
        const replacementStageId = replacementStageResult.rows[0].id;
        
        await client.query('BEGIN');
        
        // Migrate applicants using UUIDs
        const applicantResult = await client.query(
            'UPDATE "Applicant" SET "statusId" = $1 WHERE "statusId" = $2 RETURNING id',
            [replacementStageId, stageId]
        );
        
        // Migrate transition records using UUIDs
        const transitionResult = await client.query(
            'UPDATE "TransitionRecord" SET stage = $1 WHERE stage = $2 RETURNING id',
            [replacementStageId, stageId]
        );
        
        const migratedApplicants = applicantResult.rowCount;
        const migratedTransitions = transitionResult.rowCount;
        
        await client.query('COMMIT');
        
        await logAudit('AUDIT', `Migrated ${migratedApplicants} applicants and ${migratedTransitions} transition records from stage "${stageName}" to "${replacementStageName}".`, 'API:RecruitmentStages:Migrate', actingUserId, { 
            stageId: id, 
            oldStageName: stageName, 
            newStageName: replacementStageName,
            migratedApplicants,
            migratedTransitions
        });
        
        return NextResponse.json({ 
            message: `Successfully migrated ${migratedApplicants} applicants and ${migratedTransitions} transition records to "${replacementStageName}"`,
            migratedApplicants,
            migratedTransitions
        });

    } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        await client.query('ROLLBACK');
        console.error(`Failed to migrate recruitment stage ${id}:`, error);
        await logAudit('ERROR', `Failed to migrate stage (ID: ${id}). Error: ${errorMessage}`, 'API:RecruitmentStages:Migrate', actingUserId);
        
        // SECURITY: Never expose detailed error messages in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        return NextResponse.json({ 
            message: "Error migrating recruitment stage",
            error: isDevelopment ? errorMessage : "Internal server error"
        }, { status: 500 });
    } finally {
        client.release();
    }
}
