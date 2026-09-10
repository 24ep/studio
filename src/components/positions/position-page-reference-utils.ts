import type { PositionDepartmentFetcher } from './position-page-types';

export function extractUniqueDepartmentsFromPositions(positions: Array<{ department?: unknown }> | null | undefined) {
  return Array.from(new Set((positions || []).map(position => position.department)))
    .filter((department): department is string => typeof department === 'string' && !!department)
    .sort();
}

export function extractPositionApiList(data: unknown): Array<{ department?: unknown }> {
  const maybeList = (data as { data?: unknown })?.data;
  return Array.isArray(maybeList) ? maybeList as Array<{ department?: unknown }> : [];
}

async function fetchPositionDepartmentList(
  fetcher: PositionDepartmentFetcher,
  endpoint: string
) {
  const result = await fetcher(endpoint, { timeoutMs: 8000 });
  if (!result.ok || !result.data) {
    return null;
  }

  return extractUniqueDepartmentsFromPositions(extractPositionApiList(result.data));
}

export async function fetchPositionDepartments(fetcher: PositionDepartmentFetcher) {
  try {
    const departments = await fetchPositionDepartmentList(fetcher, '/api/positions/all');
    if (departments) {
      return departments;
    }
  } catch {
    // Fall back below.
  }

  try {
    return await fetchPositionDepartmentList(fetcher, '/api/positions?limit=1000') || [];
  } catch {
    return [];
  }
}

export function normalizeHiringManagers(data: unknown) {
  const users = (data as { users?: unknown })?.users;
  if (!Array.isArray(users)) return [];

  return users
    .filter((user): user is { id: string; name: string; avatarUrl?: string | null; personalColor?: string | null } => (
      typeof user?.id === 'string' && typeof user?.name === 'string'
    ))
    .map(user => ({ id: user.id, name: user.name, avatarUrl: user.avatarUrl, personalColor: user.personalColor }));
}
