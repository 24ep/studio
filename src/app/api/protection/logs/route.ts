
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        // Ensure user is authenticated and is an Admin
        if (!session || !session.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const logs = await prisma.userActivityLog.findMany({
            where: {
                action: 'SCREENSHOT_ATTEMPT'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100 // Limit to last 100 logs for now
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Error fetching security logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
