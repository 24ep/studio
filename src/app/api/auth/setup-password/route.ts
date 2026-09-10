import bcrypt from 'bcryptjs';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clearUserValidationCache } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';
import { hashPasswordSetupToken } from '@/lib/hr/employee-account-onboarding';
import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';
import { validatePassword } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const tokenSchema = z.string().min(32).max(256);
const setupPasswordSchema = z.object({
  token: tokenSchema,
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine(input => input.password === input.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

type SetupTokenRow = {
  tokenId: string;
  userId: string;
  name: string;
  email: string;
  expiresAt: Date;
};

function invalidTokenResponse() {
  return NextResponse.json(
    { valid: false, message: 'This password setup link is invalid, expired, or has already been used.' },
    { status: 400 },
  );
}

async function applySetupPasswordRateLimit(request: NextRequest) {
  const { applyRateLimit, authRateLimiter } = await import('@/lib/rateLimiter');
  const result = applyRateLimit(request, authRateLimiter);
  if (result.allowed) return null;

  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { message: 'Too many password setup attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applySetupPasswordRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const tokenResult = tokenSchema.safeParse(request.nextUrl.searchParams.get('token'));
  if (!tokenResult.success) return invalidTokenResponse();
  const tokenHash = hashPasswordSetupToken(tokenResult.data);

  const rows = await prisma.$queryRaw<SetupTokenRow[]>`
    SELECT
      token.id AS "tokenId",
      token.user_id AS "userId",
      users.name,
      users.email,
      token.expires_at AS "expiresAt"
    FROM password_setup_tokens token
    JOIN "User" users ON users.id = token.user_id
    WHERE token.token_hash = ${tokenHash}
      AND token.used_at IS NULL
      AND token.expires_at > NOW()
      AND users.is_active = true
    LIMIT 1
  `;
  const setup = rows[0];
  if (!setup) return invalidTokenResponse();

  return NextResponse.json({
    valid: true,
    name: setup.name,
    loginEmail: setup.email,
    expiresAt: setup.expiresAt,
  });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applySetupPasswordRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  const inputResult = setupPasswordSchema.safeParse(bodyResult.value);
  if (!inputResult.success) {
    return NextResponse.json({
      message: inputResult.error.issues[0]?.message || 'Invalid password setup request.',
      errors: inputResult.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const strength = validatePassword(inputResult.data.password);
  if (!strength.valid) {
    return NextResponse.json({
      message: 'Password does not meet the security requirements.',
      errors: strength.errors,
    }, { status: 400 });
  }

  const tokenHash = hashPasswordSetupToken(inputResult.data.token);
  const passwordHash = await bcrypt.hash(inputResult.data.password, 10);
  const completed = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<SetupTokenRow[]>`
      SELECT
        token.id AS "tokenId",
        token.user_id AS "userId",
        users.name,
        users.email,
        token.expires_at AS "expiresAt"
      FROM password_setup_tokens token
      JOIN "User" users ON users.id = token.user_id
      WHERE token.token_hash = ${tokenHash}
        AND token.used_at IS NULL
        AND token.expires_at > NOW()
        AND users.is_active = true
      FOR UPDATE OF token
      LIMIT 1
    `;
    const setup = rows[0];
    if (!setup) return null;

    await tx.$executeRaw`
      UPDATE "User"
      SET password = ${passwordHash},
          force_password_change = false,
          "emailVerified" = COALESCE("emailVerified", NOW()),
          "updatedAt" = NOW()
      WHERE id = ${setup.userId}::uuid
    `;
    await tx.$executeRaw`
      UPDATE password_setup_tokens
      SET used_at = NOW()
      WHERE id = ${setup.tokenId}::uuid
        AND used_at IS NULL
    `;
    return setup;
  });

  if (!completed) return invalidTokenResponse();

  clearUserValidationCache(completed.userId);
  await logAudit(
    'AUDIT',
    'Employee completed initial platform password setup.',
    'API:Auth:SetupPassword',
    completed.userId,
    { targetUserId: completed.userId },
  );

  return NextResponse.json({
    message: 'Password set successfully. You can now sign in with your employee email.',
    loginEmail: completed.email,
  });
}
