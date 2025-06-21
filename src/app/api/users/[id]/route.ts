// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { pool } from '../../../../lib/db';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import bcrypt from 'bcrypt';

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("A valid email is required").optional(),
  role: z.enum(['Admin', 'Recruiter', 'Hiring Manager']).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, name, email, role, image as "avatarUrl" FROM "User" WHERE id = $1', [params.id]);
        if (result.rows.length === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error: any) {
        console.error(`Failed to fetch user ${params.id}:`, error);
        return NextResponse.json({ message: "Error fetching user", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
        body = await request.json();
    } catch (error: any) {
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }

    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { password, ...fieldsToUpdate } = validationResult.data;

    if (Object.keys(fieldsToUpdate).length === 0 && !password) {
        return NextResponse.json({ message: "No fields to update." }, { status: 400 });
    }
    
    const client = await pool.connect();
    try {
        const updateFields: any = { ...fieldsToUpdate };
        if (password) {
            const saltRounds = 10;
            updateFields.password = await bcrypt.hash(password, saltRounds);
        }

        const setClauses = Object.keys(updateFields).map((key, index) => `"${key}" = $${index + 1}`);
        const queryParams = Object.values(updateFields);

        const updateQuery = `
            UPDATE "User"
            SET ${setClauses.join(', ')}, "updatedAt" = NOW()
            WHERE id = $${queryParams.length + 1}
            RETURNING id, name, email, role;
        `;

        const result = await client.query(updateQuery, [...queryParams, params.id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        await logAudit('AUDIT', `User '${result.rows[0].name}' (ID: ${params.id}) was updated.`, 'API:Users:Update', actingUserId, { targetUserId: params.id, changes: validationResult.data });
        return NextResponse.json(result.rows[0], { status: 200 });

    } catch (error: any) {
        console.error(`Failed to update user ${params.id}:`, error);
        await logAudit('ERROR', `Failed to update user (ID: ${params.id}). Error: ${error.message}`, 'API:Users:Update', actingUserId, { targetUserId: params.id, input: body });
        return NextResponse.json({ message: "Error updating user", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
     if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM "User" WHERE id = $1 RETURNING name', [params.id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        await logAudit('AUDIT', `User '${result.rows[0].name}' (ID: ${params.id}) was deleted.`, 'API:Users:Delete', actingUserId, { targetUserId: params.id });
        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error(`Failed to delete user ${params.id}:`, error);
        await logAudit('ERROR', `Failed to delete user (ID: ${params.id}). Error: ${error.message}`, 'API:Users:Delete', actingUserId, { targetUserId: params.id });
        return NextResponse.json({ message: "Error deleting user", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
