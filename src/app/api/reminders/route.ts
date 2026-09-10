import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Prisma.ApplicantReminderWhereInput = {
      userId: session.user.id,
    };

    if (startDate || endDate) {
      where.reminderDate = {};
      if (startDate) where.reminderDate.gte = new Date(startDate);
      if (endDate) where.reminderDate.lte = new Date(endDate);
    }

    const reminders = await prisma.applicantReminder.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            position: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { reminderDate: 'asc' },
    });

    return NextResponse.json({ data: reminders });
  } catch (err) {
    console.error('[GET /api/reminders] Error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
