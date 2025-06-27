// src/app/api/settings/webhook-mappings/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
export const dynamic = "force-dynamic";
const webhookFieldMappingSchema = z.object({
    targetPath: z.string().min(1, "Target path is required"),
    sourcePath: z.string().optional().nullable(), // Allow empty string or null for no mapping
    notes: z.string().optional().nullable(),
});
const saveWebhookMappingsSchema = z.array(webhookFieldMappingSchema);
/**
 * @openapi
 * /api/settings/webhook-mappings:
 *   get:
 *     summary: Get webhook field mappings
 *     description: Returns all webhook field mappings. Requires Admin or WEBHOOK_MAPPING_MANAGE permission.
 *     responses:
 *       200:
 *         description: List of webhook field mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 *   post:
 *     summary: Update webhook field mappings
 *     description: Updates webhook field mappings. Requires Admin or WEBHOOK_MAPPING_MANAGE permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Updated webhook field mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 */
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('WEBHOOK_MAPPING_MANAGE')) {
        await logAudit('WARN', `Forbidden attempt to GET webhook mappings by user ${session?.user?.email || 'Unknown'}.`, 'API:WebhookMappings:Get', session?.user?.id);
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }
    try {
        const result = await getPool().query('SELECT id, target_path as "targetPath", source_path as "sourcePath", notes, "createdAt", "updatedAt" FROM "WebhookFieldMapping" ORDER BY target_path ASC');
        return NextResponse.json(result.rows, { status: 200 });
    }
    catch (error) {
        console.error("Failed to fetch webhook mappings:", error);
        await logAudit('ERROR', `Failed to fetch webhook mappings by ${session?.user?.name}. Error: ${error.message}`, 'API:WebhookMappings:Get', session?.user?.id);
        return NextResponse.json({ message: "Error fetching webhook mappings", error: error.message }, { status: 500 });
    }
}
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('WEBHOOK_MAPPING_MANAGE')) {
        await logAudit('WARN', `Forbidden attempt to POST webhook mappings by user ${session?.user?.email || 'Unknown'}.`, 'API:WebhookMappings:Post', session?.user?.id);
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch (error) {
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }
    const validationResult = saveWebhookMappingsSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const mappingsToSave = validationResult.data;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        // Clear existing mappings (or use a specific config ID if multiple configs were supported)
        await client.query('DELETE FROM "WebhookFieldMapping"');
        if (mappingsToSave.length > 0) {
            const insertQuery = `
        INSERT INTO "WebhookFieldMapping" (target_path, source_path, notes, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
      `;
            for (const mapping of mappingsToSave) {
                // Ensure sourcePath is null if it's an empty string from UI for consistency
                const sourcePathValue = mapping.sourcePath === '' ? null : mapping.sourcePath;
                await client.query(insertQuery, [mapping.targetPath, sourcePathValue, mapping.notes]);
            }
        }
        await client.query('COMMIT');
        await logAudit('AUDIT', `Webhook field mappings updated by ${session.user.name}. ${mappingsToSave.length} mappings saved.`, 'API:WebhookMappings:Post', session.user.id, { count: mappingsToSave.length });
        // Fetch and return the newly saved mappings
        const result = await client.query('SELECT id, target_path as "targetPath", source_path as "sourcePath", notes, "createdAt", "updatedAt" FROM "WebhookFieldMapping" ORDER BY target_path ASC');
        return NextResponse.json(result.rows, { status: 200 });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error("Failed to save webhook mappings:", error);
        await logAudit('ERROR', `Failed to save webhook mappings by ${session.user.name}. Error: ${error.message}`, 'API:WebhookMappings:Post', session.user.id);
        return NextResponse.json({ message: "Error saving webhook mappings", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
