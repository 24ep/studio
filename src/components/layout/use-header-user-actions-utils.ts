import type { HeaderPreviewUserSummary } from './HeaderUserMenu.types';

export const HEADER_SIGNOUT_URL = '/auth/signin?signout=true';
export const HEADER_USER_SEARCH_MIN_LENGTH = 2;
export const HEADER_USER_SEARCH_LIMIT = 5;
export const HEADER_PROFILE_UPDATE_FALLBACK_MESSAGE = 'Failed to update profile';

type HeaderTranslator = (key: string, fallback: string) => string;

export interface HeaderSessionUserSummary {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatarUrl: string | null;
  image: string | null;
  personalColor: string | null;
}

export interface HeaderSessionUserLike {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  role?: unknown;
  avatarUrl?: unknown;
  image?: unknown;
  personalColor?: unknown;
}

export interface HeaderProfileUpdateResultLike {
  name?: unknown;
  email?: unknown;
  avatarUrl?: unknown;
  personalColor?: unknown;
}

export function buildHeaderUserSummary(
  sessionUser?: HeaderSessionUserLike | null,
  t?: HeaderTranslator,
): HeaderSessionUserSummary | null {
  if (!sessionUser) {
    return null;
  }

  const email = typeof sessionUser.email === 'string' ? sessionUser.email : undefined;
  const name = typeof sessionUser.name === 'string' && sessionUser.name
    ? sessionUser.name
    : email || (t ? t("header.userFallback", "User") : "User");

  return {
    id: String(sessionUser.id),
    name,
    email,
    role: typeof sessionUser.role === 'string' && sessionUser.role ? sessionUser.role : t ? t("header.recruiterFallback", "Recruiter") : 'Recruiter',
    avatarUrl: typeof sessionUser.avatarUrl === 'string' ? sessionUser.avatarUrl : null,
    image: typeof sessionUser.image === 'string' ? sessionUser.image : null,
    personalColor: typeof sessionUser.personalColor === 'string' ? sessionUser.personalColor : null,
  };
}

export function shouldUpdateHeaderSessionUser(
  sessionUser: HeaderSessionUserLike,
  result: HeaderProfileUpdateResultLike
) {
  return sessionUser.name !== result.name ||
    sessionUser.email !== result.email ||
    sessionUser.avatarUrl !== result.avatarUrl ||
    sessionUser.personalColor !== result.personalColor;
}

export function shouldForceHeaderAvatarRefresh(
  sessionUser: HeaderSessionUserLike,
  result: HeaderProfileUpdateResultLike
) {
  return sessionUser.avatarUrl !== result.avatarUrl;
}

export function shouldSearchHeaderUsers(query: string) {
  return query.length >= HEADER_USER_SEARCH_MIN_LENGTH;
}

export function buildHeaderUserSearchUrl(query: string) {
  return `/api/users?search=${encodeURIComponent(query)}&isActive=true&limit=${HEADER_USER_SEARCH_LIMIT}`;
}

export function normalizeHeaderPreviewUsers(data: unknown): HeaderPreviewUserSummary[] {
  if (!data || typeof data !== 'object' || !Array.isArray((data as { users?: unknown }).users)) {
    return [];
  }

  return (data as { users: HeaderPreviewUserSummary[] }).users;
}

export function getHeaderProfileUpdateErrorMessage(
  result: unknown,
  t?: HeaderTranslator,
) {
  if (result && typeof result === 'object' && typeof (result as { message?: unknown }).message === 'string') {
    return (result as { message: string }).message;
  }

  return t
    ? t("header.profileUpdateFailed", HEADER_PROFILE_UPDATE_FALLBACK_MESSAGE)
    : HEADER_PROFILE_UPDATE_FALLBACK_MESSAGE;
}

export function getHeaderCaughtErrorMessage(error: unknown, t?: HeaderTranslator) {
  return error instanceof Error
    ? error.message
    : getHeaderProfileUpdateErrorMessage(undefined, t);
}

export function getHeaderImpersonationLoadingMessage(
  userId: string | null,
  role: string | null,
  t?: HeaderTranslator,
) {
  return userId
    ? t
      ? t("header.switchingToUserView", "Switching to user view...")
      : "Switching to user view..."
    : t
      ? t("header.switchingToRoleView", `Switching to ${role} view...`)
      : `Switching to ${role} view...`;
}
