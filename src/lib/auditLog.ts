// src/lib/auditLog.ts

import { prisma } from './prisma';

export async function logAudit(level: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT', message: string, source: string, actingUserId: string | null = null, details: Record<string, any> | null = null) {
  try {
    await prisma.auditLog.create({
      data: {
        level,
        message,
        source,
        actingUserId,
        details,
      }
    });
  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
}
