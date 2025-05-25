
import { NextResponse, type NextRequest } from 'next/server';
import { mockCandidates, mockPositions } from '@/lib/data';
import type { Candidate, Position } from '@/lib/types';

// In-memory store for this example, replace with database logic
let candidatesStore: Candidate[] = [...mockCandidates];
const positionsStore: Position[] = [...mockPositions];


/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Retrieve a list of candidates
 *     description: Fetches all candidates. Supports filtering by name, positionId, and fitScore range via query parameters.
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
 */
export async function GET(request: NextRequest) {
  // TODO: Replace with actual database query (e.g., using Prisma or similar ORM for PostgreSQL)
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const positionId = searchParams.get('positionId');
    const minFitScore = searchParams.get('minFitScore');
    const maxFitScore = searchParams.get('maxFitScore');

    let filteredCandidates = [...candidatesStore];

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

/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create a new candidate
 *     description: Adds a new candidate to the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 example: "555-0101"
 *               positionId:
 *                 type: string
 *                 example: "pos1"
 *               parsedData:
 *                 type: object
 *                 properties:
 *                   education:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["BSc Computer Science"]
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["React", "Node.js"]
 *                   experienceYears:
 *                     type: integer
 *                     example: 3
 *                   summary:
 *                     type: string
 *                     example: "Proactive software developer."
 *                 required:
 *                   - education
 *                   - skills
 *             required:
 *               - name
 *               - email
 *               - positionId
 *               - parsedData
 *     responses:
 *       201:
 *         description: Candidate created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Invalid input or missing required fields.
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request: NextRequest) {
  // TODO: Replace with actual database insertion (e.g., using Prisma) and proper validation
  try {
    const body = await request.json();

    // Basic validation (you'd use Zod or similar in a real app)
    if (!body.name || !body.email || !body.positionId || !body.parsedData) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    const position = positionsStore.find(p => p.id === body.positionId);
    if (!position) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const newCandidate: Candidate = {
      id: `cand${Date.now()}`, // Simple ID generation for mock
      name: body.name,
      email: body.email,
      phone: body.phone || undefined,
      positionId: body.positionId,
      positionTitle: position.title, // Get title from position
      fitScore: body.fitScore || Math.floor(Math.random() * 50) + 50, // Random fit score if not provided
      status: 'Applied',
      applicationDate: new Date().toISOString(),
      lastUpdateDate: new Date().toISOString(),
      parsedData: {
        education: body.parsedData.education || [],
        skills: body.parsedData.skills || [],
        experienceYears: body.parsedData.experienceYears || 0,
        summary: body.parsedData.summary || '',
      },
      transitionHistory: [{
        id: `th-${Date.now()}`,
        date: new Date().toISOString(),
        stage: 'Applied',
        notes: 'Application received via API.',
      }],
    };

    candidatesStore.push(newCandidate);
    // TODO: Persist to PostgreSQL database here

    return NextResponse.json(newCandidate, { status: 201 });
  } catch (error) {
    console.error("Failed to create candidate:", error);
    // Check if the error is due to JSON parsing issues
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid JSON payload", error: (error as Error).message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error creating candidate", error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Retrieve a specific candidate by ID
 *     description: Fetches details for a single candidate.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the candidate to retrieve.
 *     responses:
 *       200:
 *         description: Candidate details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found.
 *       500:
 *         description: Internal server error.
 *   put:
 *     summary: Update a candidate's information
 *     description: Updates details or status for an existing candidate.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the candidate to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               positionId:
 *                 type: string
 *               fitScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               status:
 *                 type: string # Ideally use CandidateStatus enum/type
 *                 enum: ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold']
 *               parsedData:
 *                 type: object
 *                 properties:
 *                   education:
 *                     type: array
 *                     items:
 *                       type: string
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *                   experienceYears:
 *                     type: integer
 *                   summary:
 *                     type: string
 *     responses:
 *       200:
 *         description: Candidate updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Candidate or Position not found.
 *       500:
 *         description: Internal server error.
 *   delete:
 *     summary: Delete a candidate
 *     description: Removes a candidate from the system.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the candidate to delete.
 *     responses:
 *       200:
 *         description: Candidate deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Candidate not found.
 *       500:
 *         description: Internal server error.
 */
// Note: For individual candidate operations (GET by ID, PUT, DELETE),
// you would typically create a separate file like src/app/api/candidates/[id]/route.ts
// However, for simplicity in this initial setup, they are commented out here.
// If you need these, let me know and I can create the [id] route file.
// This file (src/app/api/candidates/route.ts) would then ONLY contain GET (all) and POST.
// Example of how you might structure the dynamic route:
/*
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // params.id contains the candidate ID
  // TODO: Implement logic to find and return candidate by ID
}
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // params.id contains the candidate ID
  // const body = await request.json();
  // TODO: Implement logic to update candidate by ID
}
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // params.id contains the candidate ID
  // TODO: Implement logic to delete candidate by ID
}
*/

    