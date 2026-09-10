import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import { hasAnyPermission } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';

export type PrivacySupportActor = {
  id: string;
  email?: string | null;
  role?: string | null;
  modulePermissions?: PlatformModuleId[];
};

export async function employeeContext(actor: PrivacySupportActor) {
  const employee = await getEmployeeForUser(actor.id, actor.email);
  return employee ? {
    id: String(employee.id),
    companyId: employee.company_id ? String(employee.company_id) : null,
  } : { id: null, companyId: null };
}

export function requestNumber(prefix: 'SUP' | 'PRV') {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `${prefix}-${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

const submissionTimes = new Map<string, number[]>();

export function consumeSubmission(userId: string, limit = 8, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const current = (submissionTimes.get(userId) || []).filter(time => now - time < windowMs);
  if (current.length >= limit) return false;
  current.push(now);
  submissionTimes.set(userId, current);
  return true;
}

export function isPrivacySupportAdmin(actor: PrivacySupportActor) {
  return hasAnyPermission({
    role: actor.role ?? undefined,
    modulePermissions: actor.modulePermissions,
  }, ['HR_PEOPLE_MANAGE']);
}

export async function publishedLegalDocument(documentType: string, userId: string) {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT d.id, d.document_type AS "documentType", d.title, d.version, d.content,
            d.effective_at AS "effectiveAt", d.published_at AS "publishedAt",
            a.acknowledged_at AS "acknowledgedAt"
       FROM legal_documents d
       LEFT JOIN legal_document_acknowledgments a
         ON a.document_id = d.id AND a.user_id = $2::uuid
      WHERE d.document_type = $1 AND d.status = 'published'
      ORDER BY d.published_at DESC NULLS LAST, d.created_at DESC
      LIMIT 1`,
    documentType,
    userId,
  );
  return rows[0] || null;
}
