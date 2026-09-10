export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// src/app/api/settings/user-teams/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { userTeamSchema } from './user-teams-schema';
import { createUserTeam, fetchUserTeams } from './user-teams-store';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @openapi
 * /api/settings/user-teams:
 *   get:
 *     summary: Get all user teams
 *     description: Returns all user teams. Requires authentication.
 *     responses:
 *       200:
 *         description: List of user teams
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
 *     summary: Create a new user team
 *     description: Creates a new user team. Requires authentication and Admin or USERS_CREATE permission.
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
 *               color:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 name: "Engineering Team"
 *                 description: "Software engineering team"
 *                 color: "#3B82F6"
 *                 isActive: true
 *     responses:
 *       201:
 *         description: User team created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   id: "uuid"
 *                   name: "Engineering Team"
 *                   description: "Software engineering team"
 *                   color: "#3B82F6"
 *                   isActive: true
 *                   member_count: 0
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: "Forbidden: Insufficient permissions"
 */
export async function GET(request: NextRequest) {
    void request;

    const session = await auth();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        return NextResponse.json(await fetchUserTeams());
    } catch (error: unknown) {
        console.error("Failed to fetch user teams:", error);
        return NextResponse.json({ message: "Error fetching user teams", error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await auth();
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });

    // Check permissions
    if (!hasPermission(session.user, 'USERS_CREATE')) {
        return new NextResponse('Forbidden: Insufficient permissions', { status: 403 });
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    const body = bodyResult.value;
    const validation = userTeamSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name } = validation.data;
    const newId = uuidv4();
    
    try {
        const newTeam = await createUserTeam(newId, validation.data);
        await logAudit('AUDIT', `User team '${name}' created.`, 'API:UserTeams:Create', actingUserId, { teamId: newId });
        return NextResponse.json(newTeam, { status: 201 });
    } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        console.error("Failed to create user team:", error);
        await logAudit('ERROR', `Failed to create team '${name}'. Error: ${errorMessage}`, 'API:UserTeams:Create', actingUserId, { input: body });
        return NextResponse.json({ message: "Error creating user team", error: errorMessage }, { status: 500 });
    }
}
