import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { markNotificationAsRead } from '@/lib/redis';

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/notifications\/([^/]+)\/read/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  const id = extractIdFromUrl(request);
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!id) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }

    await markNotificationAsRead(session.user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ 
      error: 'Failed to mark notification as read',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 