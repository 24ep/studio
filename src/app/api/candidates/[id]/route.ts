
import { NextResponse, type NextRequest } from 'next/server';
import { mockCandidates, mockPositions } from '@/lib/data';
import type { Candidate, Position, CandidateStatus } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// In-memory store for this example, replace with database logic
// Each API route file manages its own instance of the store for simplicity in this mock setup.
let candidatesStore: Candidate[] = JSON.parse(JSON.stringify(mockCandidates)); // Deep copy to allow mutation
const positionsStore: Position[] = [...mockPositions];

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Retrieve a specific candidate by ID
 *     description: Fetches details for a single candidate. Requires authentication.
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
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Candidate not found.
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // TODO: Replace with actual database query
  try {
    const candidate = candidatesStore.find(c => c.id === params.id);
    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch candidate ${params.id}:`, error);
    return NextResponse.json({ message: "Error fetching candidate", error: (error as Error).message }, { status: 500 });
  }
}

// Zod schema for updating a candidate (all fields optional)
const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const updateCandidateSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().optional(),
  positionId: z.string().min(1, { message: "Position ID cannot be empty" }).optional(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.enum(candidateStatusValues, { message: "Invalid status" }).optional(),
  parsedData: z.object({
    education: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    experienceYears: z.number().int().min(0).optional(),
    summary: z.string().optional(),
  }).deepPartial().optional(), // deepPartial allows partial updates to nested objects
});


/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update a candidate's information
 *     description: Updates details or status for an existing candidate. Requires authentication.
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
 *                 type: string # Ideally use CandidateStatus enum/type from lib/types
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
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Candidate or Position not found.
 *       500:
 *         description: Internal server error.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    console.error(`Error parsing JSON body for updating candidate ${params.id}:`, error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 500 });
  }

  const validationResult = updateCandidateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const validatedData = validationResult.data;

  try {
    const candidateIndex = candidatesStore.findIndex(c => c.id === params.id);

    if (candidateIndex === -1) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }

    let updatedCandidate = { ...candidatesStore[candidateIndex] };

    if (validatedData.name) updatedCandidate.name = validatedData.name;
    if (validatedData.email) updatedCandidate.email = validatedData.email;
    if (validatedData.phone) updatedCandidate.phone = validatedData.phone;
    if (validatedData.fitScore !== undefined) updatedCandidate.fitScore = validatedData.fitScore;
    if (validatedData.status) updatedCandidate.status = validatedData.status;

    if (validatedData.positionId) {
      const position = positionsStore.find(p => p.id === validatedData.positionId);
      if (!position) {
        return NextResponse.json({ message: "Position not found for new positionId" }, { status: 404 });
      }
      updatedCandidate.positionId = validatedData.positionId;
      updatedCandidate.positionTitle = position.title;
    }
    
    if (validatedData.parsedData) {
      updatedCandidate.parsedData = { 
        ...updatedCandidate.parsedData, 
        ...validatedData.parsedData,
        // Ensure arrays are not undefined if only partially updated
        education: validatedData.parsedData.education || updatedCandidate.parsedData.education,
        skills: validatedData.parsedData.skills || updatedCandidate.parsedData.skills,
      };
    }
    
    updatedCandidate.lastUpdateDate = new Date().toISOString();
    candidatesStore[candidateIndex] = updatedCandidate;
    
    // TODO: Persist to PostgreSQL database here

    return NextResponse.json(updatedCandidate, { status: 200 });
  } catch (error) {
    console.error(`Failed to update candidate ${params.id}:`, error);
    return NextResponse.json({ message: "Error updating candidate", error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete a candidate
 *     description: Removes a candidate from the system. Requires authentication.
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
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Candidate not found.
 *       500:
 *         description: Internal server error.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // TODO: Replace with actual database deletion logic
  try {
    const initialLength = candidatesStore.length;
    candidatesStore = candidatesStore.filter(c => c.id !== params.id);

    if (candidatesStore.length === initialLength) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    
    // TODO: Persist deletion to PostgreSQL database here

    return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete candidate ${params.id}:`, error);
    return NextResponse.json({ message: "Error deleting candidate", error: (error as Error).message }, { status: 500 });
  }
}
