import Credentials from 'next-auth/providers/credentials';

import { logAudit } from '@/lib/auditLog';
import { authenticateUser } from '@/lib/authUtils';
import { detectMobileUserAgent, maskEmail } from '@/lib/auth-config-utils';
import {
  AccountDisabledError,
  AccountLockedError,
  PasswordSetupRequiredError,
  TwoFactorRequiredError,
} from '@/lib/auth-errors';
import type { AuthResult } from '@/lib/auth-utils-results';
import type { UserProfile } from '@/lib/types';
import { getSystemSetting } from '@/lib/systemSettings';
import { detectDevice, serializeDevice } from '@/lib/auth-device-detection';

type AuthorizedCredentialsUser = Omit<Extract<AuthResult, { success: true }>['user'], 'role'> & {
  role: UserProfile['role'];
  isMobile?: boolean;
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
};

function normalizeAuthUserRole(role: string): UserProfile['role'] {
  return role === 'Admin' || role === 'Hiring Manager' || role === 'Employee'
    ? role
    : 'Recruiter';
}

export function buildCredentialsProvider() {
  return Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      twoFactorCode: { label: '2FA Code', type: 'text' },
    },
    async authorize(credentials, request?: Request) {
      const basicAuthEnabled = await getSystemSetting('basicAuthEnabled');
      if (basicAuthEnabled === 'false') {
        throw new Error('Basic username/password login is disabled. Please use Azure AD or another configured authentication method.');
      }

      if (!credentials?.email) {
        throw new Error('Please enter your email.');
      }

      const authResult = await authenticateUser(
        credentials.email as string,
        credentials.password as string,
        credentials.twoFactorCode as string
      );

      if (authResult.success) {
        const user: AuthorizedCredentialsUser = {
          ...authResult.user,
          role: normalizeAuthUserRole(authResult.user.role),
        };
        let isMobile = false;

        if (request?.headers) {
          const userAgent = request.headers.get('user-agent') || '';
          isMobile = detectMobileUserAgent(userAgent);
          user.userAgent = userAgent;
          user.deviceInfo = serializeDevice(detectDevice(userAgent));
          user.ipAddress = getClientIpAddress(request.headers);
        }

        user.isMobile = isMobile;
        return user;
      }

      const errorCode = authResult.error;
      if (errorCode !== 'ACCOUNT_LOCKED' && errorCode !== 'TWO_FACTOR_REQUIRED') {
        try {
          await logAudit(
            'WARN',
            `Failed credential login attempt for ${maskEmail(credentials.email as string)}: ${errorCode}`,
            'Auth:SignIn',
            null,
            { error: errorCode }
          );
        } catch (e) {
          console.error('[AUTH] Failed to log failed login audit:', e);
        }
      }

      if (errorCode === 'TWO_FACTOR_REQUIRED') {
        throw new TwoFactorRequiredError(authResult.twoFactorMethod || 'totp');
      }
      if (errorCode === 'ACCOUNT_DISABLED') {
        throw new AccountDisabledError();
      }
      if (errorCode === 'ACCOUNT_LOCKED') {
        throw new AccountLockedError();
      }
      if (errorCode === 'PASSWORD_SETUP_REQUIRED') {
        throw new PasswordSetupRequiredError();
      }

      throw new Error(authResult.message);
    },
  });
}

function getClientIpAddress(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || undefined;
}
