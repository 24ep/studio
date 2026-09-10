import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchMeetingRooms } from '@/lib/graphClient';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const rooms = await fetchMeetingRooms();
        return NextResponse.json(rooms);
    } catch (error) {
        console.error('Error fetching meeting rooms:', error);
        return NextResponse.json(
            { message: 'Failed to fetch meeting rooms' },
            { status: 500 }
        );
    }
}
