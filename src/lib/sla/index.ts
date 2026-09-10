/**
 * SLA Module
 * 
 * This module provides utilities for Service Level Agreement (SLA) tracking
 * including:
 * 
 * - SLA violation detection and notification
 * - Position and headcount SLA data queries
 * - SLA statistics and compliance reporting
 * - Audit logging for SLA events
 * 
 * @module sla
 */

// Re-export types
export type {
  SLAViolationNotification,
  SLAPositionData,
  PositionWithoutSLA,
  SLAStatistics,
  SLAHeadcountData,
  SLAStatus,
} from './types';

export { determineSLAStatus } from './types';

// Re-export query functions
export {
  getAllSLAPositions,
  getPositionsWithoutSLA,
  getAllSLAHeadcounts,
  getSLAViolationsForRecruiter,
} from './queries';

// Re-export notification functions
export {
  checkAndNotifySLAViolations,
  logSLAViolationsToAudit,
} from './notifications';

// Re-export statistics functions
export {
  getSLAStatistics,
} from './statistics';
