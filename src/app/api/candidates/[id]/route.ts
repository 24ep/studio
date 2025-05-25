
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '../../../../lib/prisma'; // Changed to relative path
import type { CandidateStatus, ParsedResumeData } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        position: true,
        transitionHistory: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });
    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch candidate ${params.id}:`, error);
    return NextResponse.json({ message: "Error fetching candidate", error: (error as Error).message }, { status: 500 });
  }
}

const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const updateCandidateSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().optional(),
  positionId: z.string().min(1, { message: "Position ID cannot be empty" }).optional(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.enum(candidateStatusValues).optional(),
  parsedData: z.object({
    education: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    experienceYears: z.number().int().min(0).optional(),
    summary: z.string().optional(),
  }).deepPartial().optional(),
  resumePath: z.string().optional(),
});


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error(`Error parsing JSON body for updating candidate ${params.id}:`, error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
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
    const existingCandidate = await prisma.candidate.findUnique({ where: { id: params.id } });
    if (!existingCandidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }

    if (validatedData.positionId) {
      const positionExists = await prisma.position.findUnique({ where: { id: validatedData.positionId } });
      if (!positionExists) {
        return NextResponse.json({ message: "Position not found for new positionId" }, { status: 404 });
      }
    }
    
    const updatePayload: any = { ...validatedData };
    
    if (validatedData.parsedData) {
        updatePayload.parsedData = {
            ...existingCandidate.parsedData as object, 
            ...validatedData.parsedData,
            education: validatedData.parsedData.education || (existingCandidate.parsedData as ParsedResumeData).education,
            skills: validatedData.parsedData.skills || (existingCandidate.parsedData as ParsedResumeData).skills,
        };
    }

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: updatePayload,
      include: {
        position: true,
        transitionHistory: { orderBy: { date: 'desc' } },
      },
    });

    if (validatedData.status && validatedData.status !== existingCandidate.status) {
      await prisma.transitionRecord.create({
        data: {
          candidateId: params.id,
          date: new Date(),
          stage: validatedData.status,
          notes: `Status updated to ${validatedData.status} via API.`,
        },
      });
      // Re-fetch candidate to include the new transition record
      const updatedCandidateWithNewTransition = await prisma.candidate.findUnique({
        where: { id: params.id },
        include: { position: true, transitionHistory: { orderBy: { date: 'desc' } } },
      });
      return NextResponse.json(updatedCandidateWithNewTransition, { status: 200 });
    }

    return NextResponse.json(candidate, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to update candidate ${params.id}:`, error);
     if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ message: "A candidate with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating candidate", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    
    // Prisma cascades deletes for TransitionRecords based on schema
    await prisma.candidate.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete candidate ${params.id}:`, error);
    return NextResponse.json({ message: "Error deleting candidate", error: (error as Error).message }, { status: 500 });
  }
}
