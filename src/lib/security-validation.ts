import type { NextRequest } from 'next/server';
import validator from 'validator';

import type { SecurityValidationResult, SessionSecurityInput } from './security-types';

const COMMON_WEAK_PASSWORDS = [
  'password',
  '123456',
  'password123',
  'admin',
  'qwerty',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  'abc123',
];

const SQL_INJECTION_URL_PATTERNS = [
  'union select',
  'drop table',
  'delete from',
  'insert into',
  'update set',
  'create table',
  'alter table',
  'exec(',
  'execute(',
  'sp_',
  'xp_',
  '0x',
  'char(',
  'ascii(',
];

const XSS_URL_PATTERNS = [
  '<script',
  'javascript:',
  'onload=',
  'onerror=',
  'onclick=',
  'onmouseover=',
  'onfocus=',
  'onblur=',
  'onchange=',
  'onkeydown=',
  'onkeyup=',
  'onkeypress=',
  'onmousedown=',
  'onmouseup=',
  'onmousemove=',
  'onmouseout=',
  'onmouseenter=',
  'onmouseleave=',
  'oncontextmenu=',
  'ondblclick=',
  'oninput=',
  'oninvalid=',
  'onreset=',
  'onselect=',
  'onsubmit=',
];

export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  return validator.isEmail(email) && email.length <= 254;
}

export function validatePassword(password: string): SecurityValidationResult {
  const errors: string[] = [];

  if (typeof password !== 'string') {
    errors.push('Password must be a string');
    return { valid: false, errors };
  }

  if (password.length < 8) errors.push('Password must be at least 8 characters long');
  if (password.length > 128) errors.push('Password must be less than 128 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/\d/.test(password)) errors.push('Password must contain at least one number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return { valid: errors.length === 0, errors };
}

export function validateUuid(uuid: string): boolean {
  if (typeof uuid !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export function validateRequest(req: NextRequest): SecurityValidationResult {
  const errors: string[] = [];

  const userAgent = req.headers.get('user-agent');
  if (!userAgent || userAgent.length > 500) {
    errors.push('Invalid or missing User-Agent');
  }

  const url = req.url.toLowerCase();
  if (SQL_INJECTION_URL_PATTERNS.some((pattern) => url.includes(pattern))) {
    errors.push('Potential SQL injection detected');
  }

  if (XSS_URL_PATTERNS.some((pattern) => url.includes(pattern))) {
    errors.push('Potential XSS attack detected');
  }

  return { valid: errors.length === 0, errors };
}

export function validateCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

export function validateSessionSecurity(session: SessionSecurityInput): SecurityValidationResult {
  const errors: string[] = [];

  if (!session) {
    errors.push('No session found');
    return { valid: false, errors };
  }

  if (!session.user) {
    errors.push('No user in session');
    return { valid: false, errors };
  }

  if (!session.user.id || typeof session.user.id !== 'string') {
    errors.push('No user ID in session');
    return { valid: false, errors };
  }

  if (!validateUuid(session.user.id)) {
    errors.push('Invalid user ID format');
    return { valid: false, errors };
  }

  const maxAge = 30 * 24 * 60 * 60 * 1000;
  if (session.expires && new Date(session.expires).getTime() - Date.now() > maxAge) {
    errors.push('Session expired');
    return { valid: false, errors };
  }

  return { valid: errors.length === 0, errors };
}
