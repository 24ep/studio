import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import bcrypt from 'bcryptjs';

import { logAudit } from '@/lib/auditLog';
import type { CreateUserInput } from './users-route-schema';
import { getCreateUserErrorMessage } from './users-route-create-errors';

export async function resolveCreateUserPassword(input: CreateUserInput, session: Session) {
  try {
    const isBasicAuthDisabled = input.authenticationMethods && !input.authenticationMethods.includes('basic');
    const isAzureAuthEnabled = input.authenticationMethods && input.authenticationMethods.includes('azure_ad');

    if (isAzureAuthEnabled && isBasicAuthDisabled) {
      return bcrypt.hash(`azure-ad-placeholder-${Date.now()}`, 10);
    }

    if (!input.password) {
      return NextResponse.json({ message: 'Password is required for basic authentication.' }, { status: 400 });
    }

    return bcrypt.hash(input.password, 10);
  } catch (hashError) {
    console.error('Error hashing password:', hashError);
    await logAudit(
      'ERROR',
      `Error hashing password for new user ${input.email} by ${session.user.name}. Error: ${getCreateUserErrorMessage(hashError)}`,
      'API:Users:Create',
      session.user.id
    );
    return NextResponse.json({ message: 'Error processing user creation (hashing failed).' }, { status: 500 });
  }
}
