import type { NextResponse } from 'next/server';

export interface ApiSecuritySession {
  user: {
    id: string;
    role?: string | null;
    modulePermissions?: string[] | null;
  };
  expires?: string | number | Date | null;
}

interface ApiSecurityGuardSuccess {
  ok: true;
  session?: ApiSecuritySession;
}

interface ApiSecurityGuardFailure {
  ok: false;
  response: NextResponse;
}

export type ApiSecurityGuardResult = ApiSecurityGuardSuccess | ApiSecurityGuardFailure;
