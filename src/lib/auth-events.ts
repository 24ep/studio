import { v4 as uuidv4 } from 'uuid';
import type { Account, Session, User } from 'next-auth';
import type { AdapterSession } from 'next-auth/adapters';
import type { JWT } from 'next-auth/jwt';

import { logAudit } from '@/lib/auditLog';
import { createUserSession, invalidateSession } from '@/lib/authUtils';
import { getSessionMaxAgeSeconds, maskEmail } from '@/lib/auth-config-utils';

type AuthEventUser = User & {
  id?: string;
  isMobile?: boolean;
  sessionToken?: string;
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
};

interface AuthSignInEvent {
  user?: AuthEventUser | null;
  account?: Account | null;
}

type AuthSignOutEvent =
  | { session: Session | AdapterSession | null | undefined | void }
  | { token: JWT | null };

function getSignOutSession(message: AuthSignOutEvent) {
  return 'session' in message ? message.session : null;
}

function getSignOutToken(message: AuthSignOutEvent) {
  return 'token' in message ? message.token : null;
}

function getSignOutUserName(session: Session | AdapterSession | null | undefined | void) {
  if (!session || !('user' in session)) {
    return 'User';
  }

  return session.user?.name || session.user?.email || 'User';
}

export function buildAuthEvents() {
  return {
    async signIn({ user, account }: AuthSignInEvent) {
      try {
        const userId = user?.id;
        if (userId) {
          const sessionToken = uuidv4();
          const isMobile = user?.isMobile ?? false;
          const maxAgeSeconds = getSessionMaxAgeSeconds(isMobile);
          const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

          try {
            const { invalidatedCount, deviceChanged } = await createUserSession(userId, sessionToken, {
              deviceInfo: user.deviceInfo || (isMobile ? 'mobile' : 'web'),
              userAgent: user.userAgent,
              ipAddress: user.ipAddress,
              expiresAt,
            });

            user.sessionToken = sessionToken;

            if (invalidatedCount > 0) {
              console.log(`[AUTH EVENT] Invalidated ${invalidatedCount} previous session(s) for user: ${maskEmail(user?.email)}`);
            }
            if (deviceChanged) {
              console.log(`[AUTH EVENT] Device change detected for user: ${maskEmail(user?.email)}`);
            }
          } catch (sessionError) {
            console.error('[AUTH EVENT] Failed to create user session:', sessionError);
          }
        }

        await logAudit(
          'AUDIT',
          `User '${user?.name || user?.email || 'Unknown'}' signed in via ${account?.provider || 'credentials'}.`,
          'Auth:SignIn',
          userId || null
        );
      } catch (e) {
        console.error('[AUTH EVENT] SignIn event failed:', e);
      }
    },
    async signOut(message: AuthSignOutEvent) {
      try {
        const session = getSignOutSession(message);
        const token = getSignOutToken(message);
        const actingUserId = token?.id || null;
        const userName = getSignOutUserName(session);
        const sessionToken = token?.sessionToken;

        if (sessionToken) {
          await invalidateSession(sessionToken);
        }

        await logAudit(
          'AUDIT',
          `User '${userName}' signed out.`,
          'Auth:SignOut',
          actingUserId
        );
      } catch (_) { }
    },
  };
}
