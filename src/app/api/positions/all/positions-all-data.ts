import { getPool } from '@/lib/db';
import type { PositionAllItem, PositionAllQuery, PositionAllRow } from './positions-all-types';

export async function fetchAllPositions(query: PositionAllQuery): Promise<PositionAllItem[]> {
  const result = await getPool().query(query.query, query.params);
  return result.rows.map(mapPositionAllRow);
}

function mapPositionAllRow(row: PositionAllRow): PositionAllItem {
  const grade = row['grade.id']
    ? {
        id: row['grade.id'] as string,
        name: row['grade.name'] as string,
        label: row['grade.label'] as string,
        color: row['grade.color'] as string,
        slaDays: row['grade.slaDays'] as number,
        createdAt: row['grade.createdAt'] as string,
        updatedAt: row['grade.updatedAt'] as string,
      }
    : undefined;

  return {
    id: row.id,
    title: row.title,
    department: row.department,
    description: row.description,
    isOpen: row.isOpen,
    positionLevel: row.positionLevel,
    customAttributes: row.customAttributes || {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    gradeId: row.gradeId,
    grade,
  };
}
