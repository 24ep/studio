
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import {
  verifyTotpCode,
  generateBackupCodes
} from '@/lib/twoFactorAuth';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readRequestJsonObject(req);
    const code = getJsonString(body, 'code');

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twoFactorMethod: true,
        twoFactorSecret: true
      }
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not initialized' }, { status: 400 });
    }

    let isValid = false;

    if (user.twoFactorMethod === 'totp') {
      isValid = verifyTotpCode(code, user.twoFactorSecret);
    } else if (user.twoFactorMethod === 'email') {
      // For email, secret holds the current OTP
      isValid = code === user.twoFactorSecret;
    }

    if (isValid) {
      // Generate backup codes on first success
      const backupCodes = generateBackupCodes();

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorVerifiedAt: new Date(),
          twoFactorBackupCodes: backupCodes,
          // If email, we might want to clear the 'secret' (which was the OTP).
          // If TOTP, we KEEP the secret.
          twoFactorSecret: user.twoFactorMethod === 'email' ? null : user.twoFactorSecret
        }
      });

      return NextResponse.json({
        success: true,
        backupCodes
      });
    } else {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

  } catch (error) {
    console.error('[2FA Verify] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
