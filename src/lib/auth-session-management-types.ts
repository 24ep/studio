import type { PlatformModuleId } from './types';

export interface CreateUserSessionOptions {
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface CreateUserSessionResult {
  sessionId: string;
  invalidatedCount: number;
  deviceChanged: boolean;
  previousDeviceInfo?: string | null;
}

export type UserSessionValidationReason = 'VALID' | 'NOT_FOUND' | 'EXPIRED' | 'INVALIDATED';

export interface UserSessionValidationResult {
  isValid: boolean;
  userId?: string;
  sessionId?: string;
  expiresAt?: Date;
  reason?: UserSessionValidationReason;
}

export interface UserSessionValidationRow {
  id: string;
  user_id: string;
  is_active: boolean;
  expires_at: Date | string;
}

export interface UserFullContextRow {
  session_id: string;
  user_id: string;
  session_active: boolean;
  expires_at: Date | string;
  last_activity_at?: Date | string | null;
  name: string;
  email: string;
  role: string;
  image: string | null;
  avatarUrl?: string | null;
  personal_color?: string | null;
  user_active: boolean;
  two_factor_enabled: boolean;
  two_factor_method: string | null;
  permissions?: PlatformModuleId[] | null;
}
