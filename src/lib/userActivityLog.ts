import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * User Activity Types
 */
export type UserActivityAction = 
  // Authentication
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'SIGN_IN_FAILED'
  | 'SESSION_EXPIRED'
  | 'API_TOKEN_GENERATED'
  // Password
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'PASSWORD_RESET_REQUEST'
  // Profile
  | 'PROFILE_UPDATE'
  | 'AVATAR_UPDATE'
  // Permissions & Access
  | 'PERMISSIONS_CHANGE'
  | 'ROLE_CHANGE'
  | 'GROUP_CHANGE'
  | 'TEAM_CHANGE'
  // Account Status
  | 'ACCOUNT_ENABLED'
  | 'ACCOUNT_DISABLED'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_DELETED'
  // Azure AD Sync
  | 'AD_SYNC_CREATED'
  | 'AD_SYNC_UPDATE'
  | 'DELETED_FROM_AD'
  // Security
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'SECURITY_ALERT';

export interface UserActivityLogParams {
  userId: string;
  action: UserActivityAction;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  performedBy?: string; // Who performed the action (for admin actions)
}

/**
 * Log a user activity event
 * 
 * @param params - Activity log parameters
 * @returns The created activity log ID, or null on error
 */
export async function logUserActivity(params: UserActivityLogParams): Promise<string | null> {
  const { userId, action, details, ipAddress, userAgent, performedBy } = params;
  
  const client = await getPool().connect();
  try {
    const id = uuidv4();
    await client.query(
      `INSERT INTO "UserActivityLog" (
        id, user_id, action, details, ip_address, user_agent, performed_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        id,
        userId,
        action,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
        userAgent || null,
        performedBy || null
      ]
    );
    return id;
  } catch (error) {
    console.error('[USER_ACTIVITY_LOG] Failed to log activity:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Helper to extract IP address from request headers
 */
export function getClientIP(headers: Headers): string | null {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || headers.get('x-real-ip') 
    || null;
}

/**
 * Helper to extract user agent from request headers
 */
export function getUserAgent(headers: Headers): string | null {
  return headers.get('user-agent') || null;
}
