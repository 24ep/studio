
import { NextResponse, type NextRequest } from 'next/server';
import { mockCandidates, mockPositions } from '@/lib/data';
import type { Candidate, Position, CandidateStatus } from '@/lib/types'; // CandidateStatus imported
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// In-memory store for this example, replace with database logic
let candidatesStore: Candidate[] = JSON.parse(JSON.stringify(mockCandidates)); // Deep copy
const positionsStore: Position[] = [...mockPositions]; // Used for validating positionId

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Retrieve a list of candidates
 *     description: Fetches all candidates. Supports filtering by name, positionId, and fitScore range via query parameters. Requires authentication.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter candidates by name (case-insensitive, partial match).
 *       - in: query
 *         name: positionId
 *         schema:
 *           type: string
 *         description: Filter candidates by position ID.
 *       - in: query
 *         name: minFitScore
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum fit score (0-100).
 *       - in: query
 *         name: maxFitScore
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum fit score (0-100).
 *     responses:
 *       200:
 *         description: A list of candidates.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Candidate'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // TODO: Replace with actual database query (e.g., using Prisma or similar ORM for PostgreSQL)
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const positionId = searchParams.get('positionId');
    const minFitScore = searchParams.get('minFitScore');
    const maxFitScore = searchParams.get('maxFitScore');

    let filteredCandidates = [...candidatesStore]; // Work with a copy

    if (name) {
      filteredCandidates = filteredCandidates.filter(c => 
        c.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    if (positionId) {
      filteredCandidates = filteredCandidates.filter(c => c.positionId === positionId);
    }
    if (minFitScore) {
      const minScore = parseInt(minFitScore, 10);
      if (!isNaN(minScore)) {
        filteredCandidates = filteredCandidates.filter(c => c.fitScore >= minScore);
      }
    }
    if (maxFitScore) {
      const maxScore = parseInt(maxFitScore, 10);
      if (!isNaN(maxScore)) {
        filteredCandidates = filteredCandidates.filter(c => c.fitScore <= maxScore);
      }
    }

    return NextResponse.json(filteredCandidates, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return NextResponse.json({ message: "Error fetching candidates", error: (error as Error).message }, { status: 500 });
  }
}

// Zod schema for creating a new candidate
const createCandidateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  positionId: z.string().min(1, { message: "Position ID is required" }),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.custom<CandidateStatus>((val) => {
    const statuses: CandidateStatus[] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];
    return statuses.includes(val as CandidateStatus);
  }, { message: "Invalid status" }).optional(),
  parsedData: z.object({
    education: z.array(z.string()).optional().default([]),
    skills: z.array(z.string()).optional().default([]),
    experienceYears: z.number().int().min(0).optional().default(0),
    summary: z.string().optional().default(''),
  }),
});


/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create a new candidate
 *     description: Adds a new candidate to the system. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCandidateInput' # Hypothetical Zod schema reference
 *     responses:
 *       201:
 *         description: Candidate created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Invalid input or missing required fields.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid JSON payload", error: error.message }, { status: 400 });
    }
    console.error("Error parsing JSON body for new candidate:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 500 });
  }
  
  const validationResult = createCandidateSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const validatedData = validationResult.data;

  try {
    const position = positionsStore.find(p => p.id === validatedData.positionId);
    if (!position) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const newCandidate: Candidate = {
      id: `cand${Date.now()}`, // Simple ID generation for mock
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      positionId: validatedData.positionId,
      positionTitle: position.title, 
      fitScore: validatedData.fitScore || Math.floor(Math.random() * 50) + 50,
      status: validatedData.status || 'Applied',
      applicationDate: new Date().toISOString(),
      lastUpdateDate: new Date().toISOString(),
      parsedData: {
        education: validatedData.parsedData.education || [],
        skills: validatedData.parsedData.skills || [],
        experienceYears: validatedData.parsedData.experienceYears || 0,
        summary: validatedData.parsedData.summary || '',
      },
      transitionHistory: [{
        id: `th-${Date.now()}`,
        date: new Date().toISOString(),
        stage: validatedData.status || 'Applied',
        notes: 'Application received via API.',
      }],
    };

    candidatesStore.push(newCandidate);
    // TODO: Persist to PostgreSQL database here

    return NextResponse.json(newCandidate, { status: 201 });
  } catch (error) {
    console.error("Failed to create candidate:", error);
    return NextResponse.json({ message: "Error creating candidate", error: (error as Error).message }, { status: 500 });
  }
}
