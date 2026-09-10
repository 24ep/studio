
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import {
  generateTotpSecret,
  generateTotpQrCodeUrl,
  generateEmailOtp,
  sendEmailOtp
} from '@/lib/twoFactorAuth';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readRequestJsonObject(req);
    const method = getJsonString(body, 'method'); // 'totp' or 'email'

    if (method !== 'totp' && method !== 'email') {
      return NextResponse.json({ error: 'Invalid 2FA method' }, { status: 400 });
    }

    // Check if trying to setup configured method again
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true }
    });

    if (user?.twoFactorEnabled) {
      // If already enabled, we might want to restrict re-setup without verification
      // For now, we'll allow re-setup (re-rolls secret) but in prod might want safeguard
    }

    if (method === 'totp') {
      // Generate TOTP secret
      const { secret, otpauth } = generateTotpSecret(session.user.email);
      const qrCodeUrl = await generateTotpQrCodeUrl(otpauth);

      // Store secret temporarily (or permanently but marked as unverified)
      // We'll store it in the user record but two_factor_enabled stays false until verified
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorMethod: 'totp',
          twoFactorSecret: secret,
          twoFactorEnabled: false // Ensure disabled until verified
        }
      });

      return NextResponse.json({
        secret,
        qrCodeUrl
      });
    }
    else if (method === 'email') {
      const otp = generateEmailOtp();
      const sent = await sendEmailOtp(session.user.email, otp, session.user.name || 'User');

      if (!sent) {
        throw new Error('Failed to send email OTP');
      }

      // Store OTP hash/secret
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorMethod: 'email',
          twoFactorSecret: otp, // In prod, hash this OTP
          twoFactorEnabled: false
        }
      });

      return NextResponse.json({ success: true, message: 'OTP sent to email' });
    }

    return NextResponse.json({ error: 'Method not supported' }, { status: 400 });

  } catch (error) {
    console.error('[2FA Setup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
