import { validate as validateUuid } from 'uuid';
import type { Session } from 'next-auth';

import { getUserFullContext, getUserPermissions, getUserSessionData } from '@/lib/authUtils';
import type { UserProfile } from '@/lib/types';
import { buildInactiveSession, hydrateSessionUserFromDb, isAdminRole } from '@/lib/auth-config-utils';
import { asMutableSession, getTokenString, isSessionValidationError } from './auth-callback-shared';
import type { AuthDbUser, MutableAuthToken, SessionCallbackInput } from './auth-callback-types';

function hasOutbornAccountAuthorization(token: MutableAuthToken) {
  return typeof token.outbornAccountAccessToken === 'string' && Boolean(token.outbornAccountAccessToken);
}

export async function handleSessionCallback({ session, token }: SessionCallbackInput) {
  if (!session || !session.user) { console.error('[SESSION CALLBACK] Invalid session object:', session); return session; }
  const tokenExp = token.exp;
  if (tokenExp && tokenExp < Math.floor(Date.now() / 1000)) throw new Error('Session expired');
  if (token.sessionToken) {
    try {
      const hydratedSession = await hydrateSessionFromContext(session, token, token.sessionToken);
      if (hydratedSession) return hydratedSession;
    } catch (validationError) {
      if (isSessionValidationError(validationError)) throw validationError;
      console.error('[SESSION CALLBACK] Error in optimized session fetch:', validationError);
    }
  }
  try { return await hydrateSessionFromTokenFallback(session, token); }
  catch (error) { console.error('[SESSION CALLBACK] Critical error in fallback:', error); return buildInactiveSession(asMutableSession(session)); }
}

async function hydrateSessionFromContext(session: Session, token: MutableAuthToken, sessionToken: string) {
  const context = await getUserFullContext(sessionToken);
  if (!context.isValid) {
    if (context.reason === 'INVALIDATED') throw new Error('Session invalidated - signed in on another device');
    if (context.reason === 'EXPIRED') throw new Error('Session expired');
    if (context.reason === 'ERROR') console.warn('[SESSION CALLBACK] Error validating session, using limited context');
    return false;
  }
  if (!context.user) return false;
  const dbUser = context.user as AuthDbUser;
  const accountAuthorized = hasOutbornAccountAuthorization(token);
  if (!dbUser.isActive && !accountAuthorized) return buildInactiveSession(asMutableSession(session));
  hydrateSessionUserFromDb(session.user as unknown as Record<string, unknown>, dbUser);
  if (accountAuthorized) {
    session.user.role = (typeof token.role === 'string' ? token.role : session.user.role) as UserProfile['role'];
    session.user.modulePermissions = token.modulePermissions ?? [];
  } else session.user.role = session.user.role as UserProfile['role'];
  session.user.twoFactorMethod = session.user.twoFactorMethod as 'email' | 'totp' | undefined;
  await applySessionImpersonation(session, dbUser, token);
  if (!accountAuthorized && typeof dbUser.role === 'string') token.role = dbUser.role;
  if (typeof dbUser.name === 'string') token.name = dbUser.name;
  return session;
}

async function applySessionImpersonation(session: Session, dbUser: AuthDbUser, token: MutableAuthToken) {
  const impersonatedUserId = getTokenString(token, 'impersonatedUserId');
  const impersonatedRole = getTokenString(token, 'impersonatedRole');
  const adminRole = hasOutbornAccountAuthorization(token) ? token.role : dbUser.role;
  if (!isAdminRole(adminRole)) return;
  if (impersonatedUserId) {
    const targetUser = await getUserSessionData(impersonatedUserId);
    if (!targetUser) return;
    session.user.id = targetUser.id;
    session.user.name = `Preview: ${targetUser.name}`;
    session.user.role = targetUser.role as UserProfile['role'];
    session.user.impersonatedUserId = targetUser.id;
    session.user.adminId = dbUser.id;
    session.user.modulePermissions = await getUserPermissions(targetUser.id);
    return;
  }
  if (impersonatedRole) {
    session.user.role = impersonatedRole as UserProfile['role'];
    session.user.name = `Preview: ${impersonatedRole}`;
    session.user.impersonatedRole = impersonatedRole as UserProfile['role'];
    session.user.adminId = dbUser.id;
  }
}

async function hydrateSessionFromTokenFallback(session: Session, token: MutableAuthToken) {
  if (typeof token.id === 'string' && !validateUuid(token.id)) { console.error('[SESSION CALLBACK] Invalid UUID in token.id:', token.id); session.user.id = ''; }
  else session.user.id = typeof token.id === 'string' ? token.id : '';
  session.user.role = (typeof token.role === 'string' ? token.role : 'Recruiter') as UserProfile['role'];
  const accountAuthorized = hasOutbornAccountAuthorization(token);
  session.user.modulePermissions = accountAuthorized
    ? (token.modulePermissions ?? [])
    : (session.user.id ? await getUserPermissions(session.user.id) : []);
  session.user.name = typeof token.name === 'string' ? token.name : session.user.name;
  session.user.avatarUrl = typeof token.avatarUrl === 'string' ? token.avatarUrl : null;
  session.user.personalColor = typeof token.personalColor === 'string' ? token.personalColor : null;
  session.user.twoFactorEnabled = typeof token.twoFactorEnabled === 'boolean' ? token.twoFactorEnabled : undefined;
  session.user.twoFactorMethod = token.twoFactorMethod;
  const impersonatedUserId = getTokenString(token, 'impersonatedUserId');
  if (impersonatedUserId) { session.user.impersonatedUserId = impersonatedUserId; session.user.adminId = getTokenString(token, 'adminId'); session.user.name = `Preview: ${getTokenString(token, 'impersonatedName') || 'User'}`; }
  const impersonatedRole = getTokenString(token, 'impersonatedRole');
  if (impersonatedRole) { session.user.impersonatedRole = impersonatedRole as UserProfile['role']; session.user.adminId = getTokenString(token, 'adminId'); session.user.name = `Preview: ${impersonatedRole}`; }
  return session;
}
