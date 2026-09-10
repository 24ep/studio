/**
 * Headcount Utilities Module
 * 
 * This module provides utilities for managing headcounts and their relationship
 * with positions and Applicants. It includes:
 * 
 * - Status checking functions
 * - Position automation (auto open/close based on headcount)
 * - Applicant assignment/unassignment
 * - Validation functions
 * - Broadcast utilities
 * 
 * @module headcount
 */

// Re-export all types
export type {
  HeadcountStatus,
  PositionActionResult,
  ValidationResult,
  UnassignWarning,
  AssignmentResult,
  UnassignmentResult,
  BatchCloseResult,
} from './types';

// Re-export status functions
export { checkPositionHeadcountStatus } from './status';

// Re-export position automation functions
export {
  autoClosePositionIfHeadcountFilled,
  reopenPositionIfHeadcountAvailable,
  autoOpenPositionIfNewHeadcountAdded,
  checkAndAutoCloseAllPositions,
} from './position-automation';

// Re-export validation functions
export {
  validateApplicantHiringStatus,
  checkHeadcountUnassignWarning,
} from './validation';

// Re-export assignment functions
export {
  assignApplicantToHeadcount,
  unassignApplicantFromHeadcount,
} from './assignment';

// Re-export broadcast utilities
export {
  broadcastPositionStats,
  broadcastPositionUpdates,
} from './broadcast';
