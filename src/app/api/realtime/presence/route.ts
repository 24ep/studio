import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateUserPresence, removeUserPresence, getOnlineUsers } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, userName, userRole, currentPage } = body;

    if (!userId || !userName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await updateUserPresence(userId, {
      userName,
      userRole: userRole || session.user.role || 'User',
      currentPage: currentPage || '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json({ 
      error: 'Failed to update presence',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await removeUserPresence(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing presence:', error);
    return NextResponse.json({ 
      error: 'Failed to remove presence',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const onlineUsers = await getOnlineUsers();
    return NextResponse.json(onlineUsers);
  } catch (error) {
    console.error('Error getting online users:', error);
    return NextResponse.json({ 
      error: 'Failed to get online users',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 