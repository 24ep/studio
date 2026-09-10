/**
 * Headcount Utilities
 * 
 * This file re-exports all functions from the headcount module for backward compatibility.
 * New code should import directly from '@/lib/headcount' instead.
 * 
 * @deprecated Import from '@/lib/headcount' instead
 * @module headcountUtils
 */

// Re-export everything from the headcount module
export {
  // Types
  type HeadcountStatus,
  type PositionActionResult,
  type ValidationResult,
  type UnassignWarning,
  type AssignmentResult,
  type UnassignmentResult,
  type BatchCloseResult,
  
  // Status functions
  checkPositionHeadcountStatus,
  
  // Position automation functions
  autoClosePositionIfHeadcountFilled,
  reopenPositionIfHeadcountAvailable,
  autoOpenPositionIfNewHeadcountAdded,
  checkAndAutoCloseAllPositions,
  
  // Validation functions
  validateApplicantHiringStatus,
  checkHeadcountUnassignWarning,
  
  // Assignment functions
  assignApplicantToHeadcount,
  unassignApplicantFromHeadcount,
  
  // Broadcast utilities
  broadcastPositionStats,
  broadcastPositionUpdates,
} from './headcount';
