import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        position: true,
        recruiter: true,
        transitionHistory: {
          include: {
            actingUser: true,
          },
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
    await logAudit('ERROR', `Failed to fetch candidate (ID: ${params.id}). Error: ${(error as Error).message}`, 'API:Candidates:GetById', session?.user?.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error fetching candidate", error: (error as Error).message }, { status: 500 });
  }
}

const personalInfoSchemaPartial = z.object({
  title_honorific: z.string().optional().nullable(),
  firstname: z.string().min(1, "First name is required").optional(),
  lastname: z.string().min(1, "Last name is required").optional(),
  nickname: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  introduction_aboutme: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
}).deepPartial();

const contactInfoSchemaPartial = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
}).deepPartial();

const educationEntrySchemaPartial = z.object({
    major: z.string().optional().nullable(),
    field: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    GPA: z.string().optional().nullable(),
    university: z.string().optional().nullable(),
    campus: z.string().optional().nullable(),
}).deepPartial();

const experienceEntrySchemaPartial = z.object({
    company: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    is_current_position: z.union([z.boolean(), z.string()]).optional(),
    position_level: z.string().optional().nullable(), // Updated to allow null
}).deepPartial();

const skillEntrySchemaPartial = z.object({
    segment_skill: z.string().optional().nullable(),
    skill: z.array(z.string()).optional(),
}).deepPartial();

const jobSuitableEntrySchemaPartial = z.object({
    suitable_career: z.string().optional().nullable(),
    suitable_job_position: z.string().optional().nullable(),
    suitable_job_level: z.string().optional().nullable(),
    suitable_salary_bath_month: z.string().optional().nullable(),
}).deepPartial();

const n8nJobMatchSchemaPartial = z.object({
  job_id: z.string().optional().nullable(),
  job_title: z.string().min(1, "Job title is required").optional(),
  fit_score: z.number().min(0).max(100, "Fit score must be between 0 and 100").optional(),
  match_reasons: z.array(z.string()).optional(),
}).deepPartial();


const candidateDetailsSchemaPartial = z.object({
  cv_language: z.string().optional().nullable(),
  personal_info: personalInfoSchemaPartial.optional(),
  contact_info: contactInfoSchemaPartial.optional(),
  education: z.array(educationEntrySchemaPartial).optional(),
  experience: z.array(experienceEntrySchemaPartial).optional(),
  skills: z.array(skillEntrySchemaPartial).optional(),
  job_suitable: z.array(jobSuitableEntrySchemaPartial).optional(),
  associatedMatchDetails: z.object({
    jobTitle: z.string().optional(),
    fitScore: z.number().optional(),
    reasons: z.array(z.string()).optional(),
    n8nJobId: z.string().optional(),
  }).deepPartial().optional(),
  job_matches: z.array(n8nJobMatchSchemaPartial).optional(),
}).deepPartial();

const updateCandidateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  recruiterId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.string().min(1).optional(),
  parsedData: candidateDetailsSchemaPartial.optional(),
  custom_attributes: z.record(z.any()).optional().nullable(),
  resumePath: z.string().optional().nullable(),
  // Added to receive transition notes explicitly for the update
  transitionNotes: z.string().optional().nullable(), 
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id || null;
  const actingUserName = session?.user?.name || session?.user?.email || 'System (API Update)';

  if (!session?.user?.id || (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_MANAGE'))) {
    await logAudit('WARN', `Forbidden attempt to update candidate ${params.id} by ${actingUserName}.`, 'API:Candidates:Update', actingUserId, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }


  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body for candidate update:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateCandidateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { transitionNotes, ...updateData } = validationResult.data;

  try {
    const updatedCandidate = await prisma.$transaction(async (tx) => {
      const existingCandidate = await tx.candidate.findUnique({
        where: { id: params.id },
      });

      if (!existingCandidate) {
        throw new Error("Candidate not found");
      }
      
      // If status is changing, create a transition record.
      if (updateData.status && updateData.status !== existingCandidate.status) {
        await tx.transitionRecord.create({
          data: {
            id: uuidv4(),
            candidateId: params.id,
            positionId: existingCandidate.positionId,
            stage: updateData.status,
            notes: transitionNotes || `Status changed from ${existingCandidate.status} to ${updateData.status}.`,
            actingUserId: actingUserId,
            date: new Date(),
          },
        });
      }

      const candidate = await tx.candidate.update({
        where: { id: params.id },
        data: updateData,
        include: {
          position: true,
          recruiter: true,
        }
      });
      
      return candidate;
    });

    await logAudit('AUDIT', `Candidate '${updatedCandidate.name}' (ID: ${params.id}) was updated by ${actingUserName}.`, 'API:Candidates:Update', actingUserId, { targetCandidateId: params.id, changes: updateData });

    return NextResponse.json({ message: "Candidate updated successfully", candidate: updatedCandidate }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating candidate:", error);
    if (error.message === "Candidate not found") {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    await logAudit('ERROR', `Error updating candidate (ID: ${params.id}). Error: ${error.message}`, 'API:Candidates:Update', actingUserId, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error updating candidate", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id || null;
  const actingUserName = session?.user?.name || session?.user?.email || 'System';

  if (!session?.user?.id || (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_MANAGE'))) {
    await logAudit('WARN', `Forbidden attempt to delete candidate ${params.id} by ${actingUserName}.`, 'API:Candidates:Delete', actingUserId, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  try {
    // Use a transaction to delete all related records first
    await prisma.$transaction(async (tx) => {
      await tx.transitionRecord.deleteMany({ where: { candidateId: params.id } });
      await tx.resumeHistory.deleteMany({ where: { candidateId: params.id } });
      await tx.candidateJobMatch.deleteMany({ where: { candidateId: params.id } });
      // Finally, delete the candidate
      await tx.candidate.delete({ where: { id: params.id } });
    });

    await logAudit('AUDIT', `Candidate (ID: ${params.id}) was deleted by ${actingUserName}.`, 'API:Candidates:Delete', actingUserId, { targetCandidateId: params.id });
    
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`Error deleting candidate ${params.id}:`, error);
    await logAudit('ERROR', `Error deleting candidate (ID: ${params.id}). Error: ${error.message}`, 'API:Candidates:Delete', actingUserId, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error deleting candidate", error: error.message }, { status: 500 });
  }
}

    