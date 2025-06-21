import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getUserNotifications, createNotification } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await getUserNotifications(session.user.id, limit);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to get notifications',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, targetUserId, title, message, data } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await createNotification({
      type,
      userId: session.user.id,
      targetUserId,
      title,
      message,
      data: data || {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ 
      error: 'Failed to create notification',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 