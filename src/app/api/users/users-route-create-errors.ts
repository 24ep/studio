import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { logAudit } from '@/lib/auditLog';

export type PrismaUserCreateError = Error & {
  code?: string;
  meta?: {
    target?: string[] | string;
  };
};

export function toPrismaUserCreateError(error: unknown): PrismaUserCreateError {
  if (error instanceof Error) {
    return error as PrismaUserCreateError;
  }

  return new Error(String(error)) as PrismaUserCreateError;
}

export function getCreateUserErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isEmailUniqueConstraintError(error: PrismaUserCreateError) {
  const target = error.meta?.target;
  return error.code === 'P2002' && (
    Array.isArray(target) ? target.includes('email') : target?.includes('email')
  );
}

export async function handleCreateUserError(error: unknown, email: string, session: Session) {
  const createError = toPrismaUserCreateError(error);
  console.error('Failed to create user:', createError);
  console.error('Error details:', {
    code: createError.code,
    meta: createError.meta,
    message: createError.message,
    ...(process.env.NODE_ENV === 'development' && { stack: createError.stack }),
  });

  const userNameForLog = session?.user?.name || session?.user?.email || 'Unknown User';
  await logAudit(
    'ERROR',
    `Failed to create user ${email} by ${userNameForLog}. Error: ${createError.message}.`,
    'API:Users:Create',
    session.user.id
  );

  if (isEmailUniqueConstraintError(createError)) {
    return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
  }

  if (createError.message.includes('Can\'t reach database server')
    || createError.message.includes('Connection')
    || createError.code === 'P1001') {
    return NextResponse.json({
      message: 'Database connection error. Please try again later or contact your system administrator.',
      error: 'Database connection failed',
    }, { status: 503 });
  }

  return NextResponse.json({
    message: 'Error creating user',
    ...(process.env.NODE_ENV === 'development' && { error: createError.message }),
  }, { status: 500 });
}
