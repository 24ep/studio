export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  createApplicantSourceSchema,
  fetchApplicantSources,
  findApplicantSourceByName,
  getApplicantSourceRouteErrorMessage,
  insertApplicantSource,
} from './applicant-sources-route-helpers';

/**
 * @openapi
 * /api/applicant-sources:
 *   get:
 *     summary: Get Applicant sources (legacy endpoint)
 *     description: Legacy endpoint that redirects to /api/settings/applicant-sources for backward compatibility.
 *     responses:
 *       200:
 *         description: List of Applicant sources
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check if user has permission to view Applicant sources
  // Users should be able to view sources if they can view Applicants (since sources are used for Applicant management)
  // Also allow Admin role to access
  const hasViewPermission = hasPermission(session.user, 'applicantS_VIEW') || 
                           session.user.role === 'Admin';
  
  if (!hasViewPermission) {
    console.warn(`Permission denied for user ${session.user.id} (${session.user.name}) - missing applicantS_VIEW permission`);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to view Applicant sources" }, { status: 403 });
  }

  try {
    return NextResponse.json(await fetchApplicantSources(), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch Applicant sources:", error);
    const errorMessage = getApplicantSourceRouteErrorMessage(error);
    await logAudit('ERROR', `Failed to fetch Applicant sources. Error: ${errorMessage}`, 'API:ApplicantSources:GetAll', session.user.id);
    return NextResponse.json({ message: "Error fetching Applicant sources", error: errorMessage }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/applicant-sources:
 *   post:
 *     summary: Create a Applicant source (legacy endpoint)
 *     description: Legacy endpoint that redirects to /api/settings/applicant-sources for backward compatibility.
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
 *               email:
 *                 type: string
 *               logo:
 *                 type: string
 *               allowSubSource:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Applicant source created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check permissions - only admins can create/edit Applicant sources
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT') && session.user.role !== 'Admin') {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: "Validation error", errors: { body: ["Invalid JSON body"] } }, { status: 400 });
    }

    const validatedData = createApplicantSourceSchema.parse(bodyResult.value);

    if (await findApplicantSourceByName(validatedData.name)) {
      return NextResponse.json({ message: "A Applicant source with this name already exists" }, { status: 409 });
    }

    const id = uuidv4();
    const newSource = await insertApplicantSource({ id, source: validatedData });
    
    await logAudit('INFO', `Created Applicant source: ${validatedData.name}`, 'API:ApplicantSources:Create', session.user.id);
    
    return NextResponse.json(newSource, { status: 201 });
  } catch (error) {
    console.error("Failed to create Applicant source:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 });
    }
    const errorMessage = getApplicantSourceRouteErrorMessage(error);
    await logAudit('ERROR', `Failed to create Applicant source. Error: ${errorMessage}`, 'API:ApplicantSources:Create', session.user.id);
    return NextResponse.json({ message: "Error creating Applicant source", error: errorMessage }, { status: 500 });
  }
}

