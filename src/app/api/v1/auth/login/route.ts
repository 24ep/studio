import { NextRequest } from 'next/server';
import { getPool, getMergedUserPermissions } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { handleCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { 
  SimpleErrorHandler,
  createValidationError, 
  createUnauthorizedError, 
  createInternalServerError 
} from '@/lib/errors';
import { logAudit } from '@/lib/auditLog';
import { getSystemSetting } from '@/lib/systemSettings';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

export async function POST(req: NextRequest) {

  const body = await readRequestJsonObject(req);
  const email = getJsonString(body, 'email');
  const password = getJsonString(body, 'password');
  if (!email || !password) {
    return SimpleErrorHandler.handleApiError(req, createValidationError('Email and password are required'));
  }
  
  // Check if basic auth is enabled
  const basicAuthEnabled = await getSystemSetting('basicAuthEnabled');
  if (basicAuthEnabled === 'false') {
    try {
      await logAudit('WARN', `Basic auth login attempt via v1 API when disabled for ${email}.`, 'API:V1:Auth:Login', null, { email });
    } catch (_) {}
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Basic username/password login is disabled. Please use Azure AD or another configured authentication method.'));
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Server misconfiguration: NEXTAUTH_SECRET is not set'));
  }
  const client = await getPool().connect();
  try {
    const result = await client.query('SELECT * FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid && user.is_active) {
        const mergedPermissions = await getMergedUserPermissions(user.id);
        
        // Generate NextAuth JWE token using encode function
        // This creates an encrypted token compatible with NextAuth's decode function
        const isSecure = process.env.NODE_ENV === 'production';
        const salt = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
        
        const token = await encode({
          token: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            modulePermissions: mergedPermissions,
            avatarUrl: user.avatar_url,
            personalColor: user.personal_color,
            // Set expiration to 1 hour from now
            exp: Math.floor(Date.now() / 1000) + (60 * 60),
            iat: Math.floor(Date.now() / 1000),
          },
          secret: process.env.NEXTAUTH_SECRET,
          salt,
        });
        
        try {
          await logAudit('AUDIT', `User '${user.email}' logged in via v1 API (NextAuth JWE token).`, 'API:V1:Auth:Login', user.id);
        } catch (_) {}
        return SimpleErrorHandler.createSuccessResponse(req, { 
          success: true, 
          token, 
          tokenType: 'JWE',
          expiresIn: 3600, // 1 hour in seconds
          user: { id: user.id, email: user.email, name: user.name, role: user.role, modulePermissions: mergedPermissions } 
        }, 200);
      }
    }
    try {
      await logAudit('WARN', `Failed v1 API login for ${email}.`, 'API:V1:Auth:Login', null, { email });
    } catch (_) {}
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Invalid email or password'));
  } catch (error) {
    try {
      await logAudit('ERROR', `Authentication error for ${email}: ${(error as Error).message}`, 'API:V1:Auth:Login');
    } catch (_) {}
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Error during authentication'));
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 
