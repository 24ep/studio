/**
 * SLA Notifications
 * Functions for checking and notifying SLA violations
 */

import { getPool } from '@/lib/db';
import type { Position } from '@/lib/types';
import { checkSLAViolation, checkSLAViolationForHeadcount } from '../slaUtils';

import { randomUUID } from 'crypto';
import type { SLAViolationNotification } from './types';

/**
 * Check for SLA violations and return notifications
 */
export async function checkAndNotifySLAViolations(): Promise<SLAViolationNotification[]> {
  const client = await getPool().connect();
  
  try {
    // Get all headcounts with position and grade information
    const query = `
      SELECT 
        h.id as "headcountId",
        h."positionId",
        h.type as "headcountType",
        h.status as "headcountStatus",
        h."applicantId",
        h."requestDate",
        h."onboardingDate",
        p.title as "positionTitle",
        p.department as "positionDepartment",
        p."recruiterId",
        u.name as "recruiterName",
        g.name as "gradeName",
        g."sla_days" as "slaDays",
        g.color as "gradeColor"
      FROM "Headcount" h
      LEFT JOIN "Position" p ON h."positionId" = p.id
      LEFT JOIN "User" u ON p."recruiterId" = u.id
      LEFT JOIN "Grade" g ON p."gradeId" = g.id
      WHERE p."gradeId" IS NOT NULL
        AND p."isOpen" = true
        AND h."requestDate" IS NOT NULL
        AND (h.status IS NULL OR h.status != 'filled')
    `;
    
    const result = await client.query(query);
    const violations: SLAViolationNotification[] = [];
    
    for (const row of result.rows) {
      const headcount = {
        id: row.headcountId,
        positionId: row.positionId,
        type: row.headcountType,
        status: row.headcountStatus,
        applicantId: row.applicantId,
        requestDate: row.requestDate,
        onboardingDate: row.onboardingDate,
        position: {
          id: row.positionId,
          title: row.positionTitle,
          department: row.positionDepartment,
          recruiterId: row.recruiterId,
          recruiterName: row.recruiterName,
          grade: {
            id: '',
            name: row.gradeName,
            slaDays: row.slaDays,
            color: row.gradeColor,
            isActive: true,
            sortOrder: 0,
            minLevel: 0,
            maxLevel: 0,
          },
        },
      };
      
      const slaResult = await checkSLAViolationForHeadcount(headcount);
      if (slaResult && slaResult.isViolated) {
        violations.push({
          positionId: row.positionId,
          positionTitle: row.positionTitle,
          recruiterId: row.recruiterId || null,
          recruiterName: row.recruiterName || null,
          gradeName: slaResult.gradeName,
          daysOverdue: slaResult.daysOverdue,
          slaDays: slaResult.slaDays,
          requestDate: row.requestDate,
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    return violations;
  } finally {
    client.release();
  }
}

/**
 * Log SLA violations to audit log and external services
 */
export async function logSLAViolationsToAudit(violations: SLAViolationNotification[]): Promise<void> {
  if (violations.length === 0) return;
  
  const client = await getPool().connect();
  
  try {
    const auditLogId = randomUUID();
    const auditTimestamp = new Date();
    const auditMessage = `SLA violation notification: ${violations.length} position(s) with SLA violations detected`;
    const auditDetails = {
      violationCount: violations.length,
      positions: violations.map(v => ({
        positionId: v.positionId,
        positionTitle: v.positionTitle,
        daysOverdue: v.daysOverdue
      }))
    };
    
    await client.query(`
      INSERT INTO "AuditLog" (id, level, message, source, "actingUserId", details, timestamp, action, entity, "entity_id")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      auditLogId,
      'WARN',
      auditMessage,
      'SLA:NotificationService',
      null,
      JSON.stringify(auditDetails),
      auditTimestamp,
      'sla_notification_sent',
      'sla_violations',
      null
    ]);
    
    // Map AuditLog format to LogEntry format for indexing
    const logEntry = {
      id: auditLogId,
      timestamp: auditTimestamp,
      level: 'WARN',
      message: auditMessage,
      source: 'SLA:NotificationService',
      actingUserId: null,
      details: auditDetails,
    };
    

    


  } finally {
    client.release();
  }
}
