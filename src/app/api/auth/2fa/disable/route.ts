
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a more secure app, we might require a password confirmation or recent 2FA check 
    // before allowing disable.

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorMethod: null,
        twoFactorVerifiedAt: null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[2FA Disable] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
