/**
 * SLA Notification Service
 * 
 * This file re-exports all functions from the sla module for backward compatibility.
 * New code should import directly from '@/lib/sla' instead.
 * 
 * @deprecated Import from '@/lib/sla' instead
 * @module slaNotificationService
 */

// Re-export everything from the sla module
export {
  // Types
  type SLAViolationNotification,
  type SLAPositionData,
  type PositionWithoutSLA,
  type SLAStatistics,
  type SLAHeadcountData,
  type SLAStatus,
  determineSLAStatus,
  
  // Query functions
  getAllSLAPositions,
  getPositionsWithoutSLA,
  getAllSLAHeadcounts,
  getSLAViolationsForRecruiter,
  
  // Notification functions
  checkAndNotifySLAViolations,
  logSLAViolationsToAudit,
  
  // Statistics functions
  getSLAStatistics,
} from './sla';
