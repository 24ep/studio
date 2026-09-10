/**
 * SLA Database Queries
 * Database query functions for SLA data
 */

import { getPool } from '@/lib/db';
import { checkSLAViolation, getSLARemainingDays, checkSLAViolationForHeadcount } from '../slaUtils';
import type { 
  SLAPositionData, 
  PositionWithoutSLA, 
  SLAHeadcountData,
  SLAViolationNotification 
} from './types';
import {
  buildSLAHeadcount,
  buildSLAPosition,
  mapSLAHeadcountData,
  mapSLAPositionData,
  mapSLAViolationNotification,
  mapPositionWithoutSLA,
  type SLAHeadcountRow,
  type SLAPositionRow,
  type PositionWithoutSLARow,
} from './query-mappers';
import {
  buildAllSLAHeadcountsQuery,
  buildAllSLAPositionsQuery,
  buildPositionsWithoutSLAQuery,
  buildSLAViolationsForRecruiterQuery,
} from './query-builders';

/**
 * Get all positions with SLA tracking data
 */
export async function getAllSLAPositions(recruiterId?: string): Promise<SLAPositionData[]> {
  const client = await getPool().connect();
  
  try {
    const { query, params } = buildAllSLAPositionsQuery(recruiterId);
    const result = await client.query<SLAPositionRow>(query, params);
    const slaPositions: SLAPositionData[] = [];
    
    for (const row of result.rows) {
      const position = buildSLAPosition(row);
      const slaResult = await checkSLAViolation(position);
      const daysRemaining = slaResult && !slaResult.isViolated 
        ? await getSLARemainingDays(position) || 0
        : 0;

      slaPositions.push(mapSLAPositionData(row, position, slaResult, daysRemaining));
    }
    
    return slaPositions;
  } finally {
    client.release();
  }
}

/**
 * Get positions without SLA (no grade assigned)
 */
export async function getPositionsWithoutSLA(recruiterId?: string): Promise<PositionWithoutSLA[]> {
  const client = await getPool().connect();
  
  try {
    const { query, params } = buildPositionsWithoutSLAQuery(recruiterId);
    const result = await client.query<PositionWithoutSLARow>(query, params);
    
    return result.rows.map(mapPositionWithoutSLA);
  } finally {
    client.release();
  }
}

/**
 * Get all headcounts with SLA tracking data
 */
export async function getAllSLAHeadcounts(recruiterId?: string): Promise<SLAHeadcountData[]> {
  const client = await getPool().connect();
  
  try {
    const { query, params } = buildAllSLAHeadcountsQuery(recruiterId);
    const result = await client.query<SLAHeadcountRow>(query, params);
    const slaHeadcounts: SLAHeadcountData[] = [];
    
    for (const row of result.rows) {
      const headcount = buildSLAHeadcount(row);
      const slaResult = await checkSLAViolationForHeadcount(headcount);

      slaHeadcounts.push(mapSLAHeadcountData(row, headcount, slaResult));
    }
    
    return slaHeadcounts;
  } finally {
    client.release();
  }
}

/**
 * Get SLA violations for a specific recruiter
 */
export async function getSLAViolationsForRecruiter(recruiterId: string): Promise<SLAViolationNotification[]> {
  const client = await getPool().connect();
  
  try {
    const { query } = buildSLAViolationsForRecruiterQuery();
    const result = await client.query<SLAPositionRow>(query, [recruiterId]);
    const violations: SLAViolationNotification[] = [];
    
    for (const row of result.rows) {
      const position = buildSLAPosition(row, '');
      const slaResult = await checkSLAViolation(position);
      if (slaResult && slaResult.isViolated) {
        violations.push(mapSLAViolationNotification(row, position, slaResult));
      }
    }
    
    return violations;
  } finally {
    client.release();
  }
}
