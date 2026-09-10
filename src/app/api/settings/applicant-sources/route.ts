export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  requireApplicantSourcesRouteSession,
  requireApplicantSourcesViewPermission,
  requireApplicantSourcesWritePermission,
} from './applicant-sources-route-auth';
import {
  applicantSourceNameExists,
  createApplicantSource,
  fetchApplicantSources,
} from './applicant-sources-route-data';
import {
  createApplicantSourceSchema,
  getApplicantSourcesRouteErrorMessage,
} from './applicant-sources-route-schema';

/**
 * @openapi
 * /api/settings/applicant-sources:
 *   get:
 *     summary: Get Applicant sources
 *     description: Returns all Applicant sources ordered by sort order.
 *     responses:
 *       200:
 *         description: List of Applicant sources
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
 *     summary: Create a Applicant source
 *     description: Creates a new Applicant source. Requires Admin or SYSTEM_SETTINGS_MANAGE permission.
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
export async function GET(request: NextRequest) {
  void request;
  const sessionResult = await requireApplicantSourcesRouteSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }
  const { session } = sessionResult;

  const permissionError = requireApplicantSourcesViewPermission(session.user);
  if (permissionError) {
    return permissionError;
  }

  try {
    const sources = await fetchApplicantSources();
    return NextResponse.json(sources, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getApplicantSourcesRouteErrorMessage(error);
    console.error("Failed to fetch Applicant sources:", error);
    await logAudit('ERROR', `Failed to fetch Applicant sources. Error: ${errorMessage}`, 'API:ApplicantSources:GetAll', session.user.id);
    return NextResponse.json({ message: "Error fetching Applicant sources", error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionResult = await requireApplicantSourcesRouteSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }
  const { session } = sessionResult;

  const permissionError = requireApplicantSourcesWritePermission(session.user);
  if (permissionError) {
    return permissionError;
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const body = bodyResult.value;
    const validatedData = createApplicantSourceSchema.parse(body);

    if (await applicantSourceNameExists(validatedData.name)) {
      return NextResponse.json({ message: "A Applicant source with this name already exists" }, { status: 409 });
    }

    const newSource = await createApplicantSource(validatedData);
    
    await logAudit('INFO', `Created Applicant source: ${validatedData.name}`, 'API:ApplicantSources:Create', session.user.id);
    
    return NextResponse.json(newSource, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = getApplicantSourcesRouteErrorMessage(error);
    console.error("Failed to create Applicant source:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 });
    }
    await logAudit('ERROR', `Failed to create Applicant source. Error: ${errorMessage}`, 'API:ApplicantSources:Create', session.user.id);
    return NextResponse.json({ message: "Error creating Applicant source", error: errorMessage }, { status: 500 });
  }
}

