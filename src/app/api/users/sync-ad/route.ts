import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { isGraphConfiguredAsync } from '@/lib/graphClient';
import { hasAnyPermission } from '@/lib/permissions';
import { runAzureAdSyncStream } from './azure-ad-sync-workflow';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized: User session required.' },
      { status: 401 }
    );
  }

  if (!hasAnyPermission(session.user, ['USERS_CREATE'])) {
    await logAudit(
      'WARN',
      `Forbidden attempt to sync AD users by ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required: USERS_CREATE permission.`,
      'API:Users:SyncAD',
      session?.user?.id
    );
    return NextResponse.json(
      { message: 'Forbidden: You must have USERS_CREATE permission to sync users from Azure AD.' },
      { status: 403 }
    );
  }

  if (!await isGraphConfiguredAsync()) {
    return NextResponse.json(
      { message: 'Azure AD is not configured. Please configure Azure AD credentials in environment variables.' },
      { status: 400 }
    );
  }

  return new Response(createAzureAdSyncReadableStream(session), {
    headers: { 'Content-Type': 'application/json' },
  });
}

type AzureAdRouteSession = Session & {
  user: Session['user'] & {
    id: string;
    email?: string | null;
  };
};

function createAzureAdSyncReadableStream(session: AzureAdRouteSession) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        await runAzureAdSyncStream({
          session,
          sendProgress: (message: string, isError = false) => {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'progress', message, isError }) + '\n'));
          },
          sendResult: (data: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'result', ...data }) + '\n'));
          },
        });
      } finally {
        controller.close();
      }
    },
  });
}
