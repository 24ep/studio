
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { CandidateStatus, ParsedResumeData } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Zod schema for creating a new candidate (based on types.ts and Prisma model)
const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const createCandidateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  positionId: z.string().min(1, { message: "Position ID is required" }),
  fitScore: z.number().min(0).max(100).default(0), // Default fit score to 0 if not provided
  status: z.enum(candidateStatusValues).default('Applied'),
  applicationDate: z.string().datetime().optional(), // Optional, Prisma defaults to now()
  parsedData: z.object({
    education: z.array(z.string()).optional().default([]),
    skills: z.array(z.string()).optional().default([]),
    experienceYears: z.number().int().min(0).optional().default(0),
    summary: z.string().optional().default(''),
  }).default({ education: [], skills: [], experienceYears: 0, summary: '' }), // Default for the whole object
  // transitionHistory is not part of creation schema directly, will be added based on initial status
  resumePath: z.string().optional(), // Path/key in MinIO
});


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const positionId = searchParams.get('positionId');
    const minFitScore = searchParams.get('minFitScore');
    const maxFitScore = searchParams.get('maxFitScore');

    const whereClause: any = {};
    if (name) whereClause.name = { contains: name, mode: 'insensitive' };
    if (positionId) whereClause.positionId = positionId;
    if (minFitScore) whereClause.fitScore = { ...whereClause.fitScore, gte: parseInt(minFitScore, 10) };
    if (maxFitScore) whereClause.fitScore = { ...whereClause.fitScore, lte: parseInt(maxFitScore, 10) };
    
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        position: true, // Include related position data
        transitionHistory: { // Optionally include transition history, ordered by date
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(candidates, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return NextResponse.json({ message: "Error fetching candidates", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing JSON body for new candidate:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
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
    // Check if position exists
    const position = await prisma.position.findUnique({ where: { id: validatedData.positionId } });
    if (!position) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const newCandidate = await prisma.candidate.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        positionId: validatedData.positionId,
        fitScore: validatedData.fitScore,
        status: validatedData.status,
        applicationDate: validatedData.applicationDate ? new Date(validatedData.applicationDate) : new Date(),
        parsedData: validatedData.parsedData as unknown as ParsedResumeData, // Cast because Prisma expects specific JSON structure
        resumePath: validatedData.resumePath,
        transitionHistory: {
          create: [
            {
              date: new Date(),
              stage: validatedData.status,
              notes: 'Application received.',
            },
          ],
        },
      },
      include: {
        position: true,
        transitionHistory: true,
      },
    });

    return NextResponse.json(newCandidate, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create candidate:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ message: "A candidate with this email already exists." }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ message: "Error creating candidate", error: error.message }, { status: 500 });
  }
}
