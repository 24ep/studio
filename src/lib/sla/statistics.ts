/**
 * SLA Statistics
 * Functions for calculating SLA statistics
 */

import type { SLAPositionData, SLAStatistics } from './types';
import { getAllSLAPositions } from './queries';

/**
 * Get SLA statistics across all positions or for a specific recruiter
 */
export async function getSLAStatistics(recruiterId?: string): Promise<SLAStatistics> {
  const positions = await getAllSLAPositions(recruiterId);
  
  const stats: SLAStatistics = {
    total: positions.length,
    onTrack: 0,
    warning: 0,
    critical: 0,
    urgent: 0,
    complianceRate: 0,
    averageDaysOverdue: 0,
    totalDaysOverdue: 0,
    byGrade: {},
    byRecruiter: {},
  };
  
  if (positions.length === 0) {
    stats.complianceRate = 100;
    return stats;
  }
  
  let totalDaysOverdue = 0;
  let violationCount = 0;
  
  for (const position of positions) {
    // Count by status
    switch (position.status) {
      case 'on_track':
        stats.onTrack++;
        break;
      case 'warning':
        stats.warning++;
        break;
      case 'critical':
        stats.critical++;
        break;
      case 'urgent':
        stats.urgent++;
        break;
    }
    
    // Track violations
    if (position.isViolated) {
      violationCount++;
      totalDaysOverdue += position.daysOverdue;
    }
    
    // Track by grade
    const gradeName = position.gradeName || 'Unknown';
    if (!stats.byGrade[gradeName]) {
      stats.byGrade[gradeName] = {
        total: 0,
        violations: 0,
        complianceRate: 0,
      };
    }
    stats.byGrade[gradeName].total++;
    if (position.isViolated) {
      stats.byGrade[gradeName].violations++;
    }
    
    // Track by recruiter
    const recruiterName = position.recruiterName || 'Unassigned';
    if (!stats.byRecruiter[recruiterName]) {
      stats.byRecruiter[recruiterName] = {
        total: 0,
        violations: 0,
        complianceRate: 0,
      };
    }
    stats.byRecruiter[recruiterName].total++;
    if (position.isViolated) {
      stats.byRecruiter[recruiterName].violations++;
    }
  }
  
  // Calculate overall metrics
  stats.totalDaysOverdue = totalDaysOverdue;
  stats.averageDaysOverdue = violationCount > 0 ? totalDaysOverdue / violationCount : 0;
  stats.complianceRate = ((stats.total - violationCount) / stats.total) * 100;
  
  // Calculate compliance rates by grade
  for (const gradeName of Object.keys(stats.byGrade)) {
    const gradeStats = stats.byGrade[gradeName];
    gradeStats.complianceRate = gradeStats.total > 0 
      ? ((gradeStats.total - gradeStats.violations) / gradeStats.total) * 100 
      : 100;
  }
  
  // Calculate compliance rates by recruiter
  for (const recruiterName of Object.keys(stats.byRecruiter)) {
    const recruiterStats = stats.byRecruiter[recruiterName];
    recruiterStats.complianceRate = recruiterStats.total > 0 
      ? ((recruiterStats.total - recruiterStats.violations) / recruiterStats.total) * 100 
      : 100;
  }
  
  return stats;
}
