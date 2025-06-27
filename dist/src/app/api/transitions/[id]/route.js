// src/app/api/transitions/[id]/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
export const dynamic = "force-dynamic";
const updateTransitionSchema = z.object({
    notes: z.string().optional().nullable(),
});
function extractIdFromUrl(request) {
    const match = request.nextUrl.pathname.match(/\/transitions\/([^/]+)/);
    return match ? match[1] : null;
}
export async function PUT(request) {
    const id = extractIdFromUrl(request);
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch (error) {
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }
    const validationResult = updateTransitionSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const client = await getPool().connect();
    try {
        const query = 'UPDATE "TransitionRecord" SET notes = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *';
        const result = await client.query(query, [validationResult.data.notes, id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
        }
        await logAudit('AUDIT', `Transition record (ID: ${id}) was updated.`, 'API:Transitions:Update', actingUserId, { transitionId: id });
        return NextResponse.json(result.rows[0], { status: 200 });
    }
    catch (error) {
        console.error(`Failed to update transition record ${id}:`, error);
        await logAudit('ERROR', `Failed to update transition record (ID: ${id}). Error: ${error.message}`, 'API:Transitions:Update', actingUserId);
        return NextResponse.json({ message: "Error updating transition record", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
export async function DELETE(request) {
    const id = extractIdFromUrl(request);
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const client = await getPool().connect();
    try {
        const result = await client.query('DELETE FROM "TransitionRecord" WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
        }
        await logAudit('AUDIT', `Transition record (ID: ${id}) was deleted.`, 'API:Transitions:Delete', actingUserId, { transitionId: id });
        return NextResponse.json({ message: "Transition record deleted successfully" }, { status: 200 });
    }
    catch (error) {
        console.error(`Failed to delete transition record ${id}:`, error);
        await logAudit('ERROR', `Failed to delete transition record (ID: ${id}). Error: ${error.message}`, 'API:Transitions:Delete', actingUserId);
        return NextResponse.json({ message: "Error deleting transition record", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
