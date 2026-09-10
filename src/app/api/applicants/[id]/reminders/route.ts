import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { readRequestJsonResult } from '@/lib/request-json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reminderSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  reminderDate: z.string().datetime(),
});

function isMissingReminderTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('applicantreminder') ||
    message.includes('applicant_reminders') ||
    message.includes('relation') ||
    message.includes('table');
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const reminders = await prisma.applicantReminder.findMany({
      where: { applicantId: id },
      orderBy: { reminderDate: 'asc' },
    });

    return NextResponse.json({ data: reminders });
  } catch (err) {
    console.error(`[GET /api/applicants/${id}/reminders] Error:`, err);
    if (isMissingReminderTableError(err)) {
      return NextResponse.json({
        data: [],
        warning: 'Applicant reminders are unavailable because the reminders table is not available in this environment.',
      });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const bodyResult = await readRequestJsonResult(req);
    const validation = reminderSchema.safeParse(bodyResult.ok ? bodyResult.value : undefined);
    
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid request data', errors: validation.error.errors }, { status: 400 });
    }

    const { title, content, reminderDate } = validation.data;

    const reminder = await prisma.applicantReminder.create({
      data: {
        applicantId: id,
        userId: session.user.id,
        title,
        content,
        reminderDate: new Date(reminderDate),
      },
    });

    // Broadcast update to applicant detail view
    broadcastApplicantUpdate({ id, action: 'reminder_added', reminder }, session.user.id);

    return NextResponse.json({ data: reminder }, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/applicants/${id}/reminders] Error:`, err);
    if (isMissingReminderTableError(err)) {
      return NextResponse.json({
        message: 'Applicant reminders are unavailable because the reminders table is not available in this environment.',
      }, { status: 503 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
