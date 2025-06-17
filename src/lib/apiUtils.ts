// src/lib/apiUtils.ts
import pool from './db';
import type { Position, RecruitmentStage } from './types';

export async function fetchAllPositionsDb(): Promise<Position[]> {
  try {
    const result = await pool.query('SELECT id, title, department, description, "isOpen", position_level, custom_attributes, "createdAt", "updatedAt" FROM "Position" ORDER BY title ASC');
    return result.rows.map(row => ({
      ...row,
      custom_attributes: row.custom_attributes || {},
    }));
  } catch (error) {
    console.error("Error fetching all positions from DB:", error);
    return [];
  }
}

export async function fetchAllRecruitmentStagesDb(): Promise<RecruitmentStage[]> {
  try {
    const result = await pool.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
    return result.rows;
  } catch (error) {
    console.error("Error fetching all recruitment stages from DB:", error);
    return [];
  }
}
