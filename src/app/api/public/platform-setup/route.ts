export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import bcrypt from 'bcryptjs';
import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

import { clearUserValidationCache } from '@/lib/auth';
import { ADMIN_DEFAULT_PERMISSIONS } from '@/lib/default-role-permissions';
import {
  firstAdminSetupSchema,
  getInstallationSetupState,
  isPlatformSetupRequired,
} from '@/lib/platform-installation';
import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';
import { validatePassword } from '@/lib/security';

async function applySetupRateLimit(request: NextRequest) {
  const { applyRateLimit, authRateLimiter } = await import('@/lib/rateLimiter');
  const result = applyRateLimit(request, authRateLimiter);
  if (result.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));
  return NextResponse.json(
    { message: 'Too many setup attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}

export async function GET() {
  try {
    const [setupRequired, state] = await Promise.all([isPlatformSetupRequired(), getInstallationSetupState()]);
    return NextResponse.json({ setupRequired, ...state });
  } catch (error) {
    console.error('Failed to check platform installation:', error);
    return NextResponse.json({ message: 'Unable to check platform setup.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applySetupRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid setup request.' }, { status: 400 });
  }

  const inputResult = firstAdminSetupSchema.safeParse(bodyResult.value);
  if (!inputResult.success) {
    return NextResponse.json({
      message: inputResult.error.issues[0]?.message || 'Invalid administrator details.',
      errors: inputResult.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const passwordStrength = validatePassword(inputResult.data.password);
  if (!passwordStrength.valid) {
    return NextResponse.json({
      message: 'Password does not meet the security requirements.',
      errors: passwordStrength.errors,
    }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(inputResult.data.password, 12);
  try {
    const admin = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('hrive-first-admin-setup'))`;
      const existingAdminCount = await tx.user.count({ where: { role: 'Admin', isActive: true } });
      if (existingAdminCount > 0) return null;

      const adminGroup = await tx.userGroup.upsert({
        where: { name: 'Admin' },
        update: {
          description: 'Full platform administration access',
          permissions: [...ADMIN_DEFAULT_PERMISSIONS],
          isDefault: false,
          isSystemRole: true,
        },
        create: {
          name: 'Admin',
          description: 'Full platform administration access',
          permissions: [...ADMIN_DEFAULT_PERMISSIONS],
          isDefault: false,
          isSystemRole: true,
        },
      });

      const createdAdmin = await tx.user.create({
        data: {
          name: inputResult.data.name,
          email: inputResult.data.email,
          password: passwordHash,
          role: 'Admin',
          authenticationMethods: ['basic'],
          forcePasswordChange: false,
          emailVerified: new Date(),
          isActive: true,
          module_permissions: [...ADMIN_DEFAULT_PERMISSIONS],
          userGroupId: adminGroup.id,
        },
        select: { id: true, email: true, name: true },
      });

      await tx.systemSetting.upsert({
        where: { key: 'platformInstalledAt' },
        update: { value: new Date().toISOString() },
        create: { key: 'platformInstalledAt', value: new Date().toISOString() },
      });
      await tx.systemSetting.upsert({
        where: { key: 'platformInstalledByUserId' },
        update: { value: createdAdmin.id },
        create: { key: 'platformInstalledByUserId', value: createdAdmin.id },
      });
      return createdAdmin;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (!admin) {
      return NextResponse.json({ message: 'Platform setup has already been completed.' }, { status: 409 });
    }

    clearUserValidationCache(admin.id);
    return NextResponse.json({
      message: 'Administrator account created.',
      admin: { name: admin.name, email: admin.email },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'That email address is already in use.' }, { status: 409 });
    }
    console.error('Failed to create the first administrator:', error);
    return NextResponse.json({ message: 'Unable to create the administrator account.' }, { status: 500 });
  }
}
