import { getSystemSetting } from '@/lib/systemSettings';
import type { PositionAllFilters, PositionAllQuery, PositionAllUserContext } from './positions-all-types';

export function parsePositionsAllFilters(searchParams: URLSearchParams): PositionAllFilters {
  return {
    title: searchParams.get('title') || undefined,
    department: searchParams.get('department') || undefined,
    isOpen: searchParams.get('isOpen') || undefined,
    positionLevel: searchParams.get('positionLevel') || undefined,
  };
}

export async function buildPositionsAllQuery(filters: PositionAllFilters, user: PositionAllUserContext): Promise<PositionAllQuery> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;
  let query = BASE_POSITIONS_ALL_QUERY;

  if (user.userRole === 'Hiring Manager' && !user.hasViewAllPermission) {
    const restrictSetting = await getSystemSetting('hiringManagerRestrictToAssignedPositions');
    if (restrictSetting !== 'false') {
      conditions.push(`pi."userId" = $${paramIndex++}`);
      params.push(user.userId);
      query += ' INNER JOIN "PositionInterviewer" pi ON p.id = pi."positionId"';
    }
  }

  if (filters.title) {
    conditions.push(`p.title ILIKE $${paramIndex++}`);
    params.push(`%${filters.title}%`);
  }

  if (filters.department) {
    conditions.push(`p.department = ANY($${paramIndex++}::text[])`);
    params.push(filters.department.split(',').map(department => department.trim()));
  }

  if (filters.isOpen === 'true') {
    conditions.push('p."isOpen" = TRUE');
  } else if (filters.isOpen === 'false') {
    conditions.push('p."isOpen" = FALSE');
  }

  if (filters.positionLevel) {
    conditions.push(`p."positionLevel" ILIKE $${paramIndex++}`);
    params.push(`%${filters.positionLevel}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY p."createdAt" DESC';

  return { query, params };
}

const BASE_POSITIONS_ALL_QUERY = `
  SELECT 
    p.id, 
    p.title, 
    p.department, 
    p.description, 
    p."isOpen", 
    p."positionLevel", 
    p."customAttributes", 
    p."createdAt", 
    p."updatedAt",
    p."gradeId",
    g.id as "grade.id",
    g.name as "grade.name",
    g.label as "grade.label",
    g.color as "grade.color",
    g."sla_days" as "grade.slaDays",
    g."createdAt" as "grade.createdAt",
    g."updatedAt" as "grade.updatedAt"
  FROM "Position" p
  LEFT JOIN "Grade" g ON p."gradeId" = g.id
`;
