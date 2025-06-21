// src/app/api/settings/user-groups/route.ts
import { NextResponse, type NextRequest } from 'next/server';
// import { pool } from '../../../../lib/db';
import { pool } from '@/lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';

const userGroupSchema = z.object({
  name: z.string().min(1, 'Group name cannot be empty.'),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM "UserGroup" ORDER BY name ASC');
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error("Failed to fetch user groups:", error);
        return NextResponse.json({ message: "Error fetching user groups", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession();
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    const validation = userGroupSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, description, permissions } = validation.data;
    const newId = uuidv4();
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO "UserGroup" (id, name, description, permissions) VALUES ($1, $2, $3, $4) RETURNING *',
            [newId, name, description, permissions ?? []]
        );
        await logAudit('AUDIT', `User group '${name}' created.`, 'API:UserGroups:Create', actingUserId, { groupId: newId });
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Failed to create user group:", error);
        await logAudit('ERROR', `Failed to create group '${name}'. Error: ${error.message}`, 'API:UserGroups:Create', actingUserId, { input: body });
        return NextResponse.json({ message: "Error creating user group", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
