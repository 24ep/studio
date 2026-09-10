import { toIsoString } from './root-dashboard-date-score-utils';
import type {
  DashboardPositionRow,
  DashboardUserRow,
} from './root-dashboard-initial-types';

export function mapDashboardPositionRows(rows: DashboardPositionRow[]) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department || '',
    description: row.description,
    requirements: row.requirements,
    isOpen: row.isOpen !== false,
    positionLevel: row.positionLevel,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }));
}

export function mapDashboardUserRows(rows: DashboardUserRow[]) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatarUrl || undefined,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }));
}
