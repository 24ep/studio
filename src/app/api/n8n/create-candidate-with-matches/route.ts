// src/app/api/n8n/create-candidate-with-matches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '../../../../lib/prisma';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';

// Define a simpler, more direct schema for the expected webhook payload.
// This avoids complex transformations and relies on the n8n workflow to provide a clean payload.
const n8nWebhookPayloadSchema = z.object({
  personal_info: z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
  }),
  job_info: z.object({
    positionTitle: z.string().min(1),
    fitScore: z.number().min(0).max(100).optional().nullable(),
    justification: z.array(z.string()).optional().nullable(),
  }).optional().nullable(),
  // Including the full resume parse data is optional and can be complex.
  // We will just save it as a JSON blob.
  full_parsed_data: z.any().optional(),
});

export async function POST(request: NextRequest) {
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = n8nWebhookPayloadSchema.safeParse(requestBody);

  if (!validationResult.success) {
    await logAudit('ERROR', 'N8N Webhook: Invalid input received.', 'API:N8N:CreateCandidateWithMatches', null, {
      errors: validationResult.error.flatten(),
      receivedPayload: requestBody,
    });
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const { personal_info, job_info, full_parsed_data } = validationResult.data;
  const candidateName = `${personal_info.firstname} ${personal_info.lastname}`.trim();

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      let positionId: string | null = null;
      let positionTitle: string | null = null;

      // --- Find or Create Position ---
      if (job_info?.positionTitle) {
        positionTitle = job_info.positionTitle;
        const existingPosition = await tx.position.findFirst({
          where: { title: { equals: positionTitle, mode: 'insensitive' } },
        });

        if (existingPosition) {
          positionId = existingPosition.id;
        } else {
          const newPosition = await tx.position.create({
            data: {
              id: uuidv4(),
              title: positionTitle,
              description: 'Auto-created from n8n webhook.',
              department: 'Uncategorized',
              isOpen: true,
              position_level: 'entry level',
            },
          });
          positionId = newPosition.id;
        }
      }

      // --- Create Candidate ---
      const newCandidateId = uuidv4();
      const createdCandidate = await tx.candidate.create({
        data: {
          id: newCandidateId,
          name: candidateName,
          email: personal_info.email,
          phone: personal_info.phone,
          positionId: positionId,
          applicationDate: new Date(),
          status: 'Applied',
          parsedData: full_parsed_data || { personal_info }, // Save the full data if provided
          fitScore: job_info?.fitScore,
          custom_attributes: {},
        },
      });

      // --- Create Initial Transition Record ---
      if (positionId && positionTitle) {
        await tx.transitionRecord.create({
          data: {
            id: uuidv4(),
            candidateId: newCandidateId,
            positionId: positionId,
            stage: 'Applied',
            notes: `Candidate created via n8n for position "${positionTitle}". Justification: ${job_info?.justification?.join(', ') || 'N/A'}`,
            date: new Date(),
          },
        });
      }
      
      return createdCandidate;
    });

    await logAudit('AUDIT', `N8N Webhook: Candidate '${result.name}' (ID: ${result.id}) created successfully.`, 'API:N8N:CreateCandidateWithMatches', null, { candidateId: result.id });

    return NextResponse.json({ status: 'success', candidate: result }, { status: 201 });

  } catch (error: any) {
    console.error("N8N Webhook: Error processing request:", error);
    await logAudit('ERROR', `N8N Webhook: Error processing request. Error: ${error.message}`, 'API:N8N:CreateCandidateWithMatches', null, { error: error.message });
    return NextResponse.json({ message: "Error processing webhook request.", error: error.message }, { status: 500 });
  }
}
