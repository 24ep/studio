import type { Prisma } from '@prisma/client';

export type UsersPagination = {
  page: number;
  pageSize: number;
  skip: number;
};

export function buildUsersWhereConditionsForAccess(
  searchParams: URLSearchParams,
  canManageUsers: boolean
): Prisma.UserWhereInput {
  const whereConditions: Prisma.UserWhereInput = {};
  const filterRoleInput = searchParams.get('role');

  if (filterRoleInput && filterRoleInput !== 'ALL_ROLES') {
    whereConditions.role = normalizeRoleFilter(filterRoleInput);
  } else if (!canManageUsers) {
    whereConditions.role = 'Recruiter';
  }

  const filterSearchInput = searchParams.get('search');
  const filterNameInput = searchParams.get('name');
  const filterEmailInput = searchParams.get('email');
  const filterTeamIdInput = searchParams.get('teamId');

  if (filterSearchInput) {
    whereConditions.OR = [
      { name: { contains: filterSearchInput, mode: 'insensitive' } },
      { email: { contains: filterSearchInput, mode: 'insensitive' } },
    ];
  }
  if (filterNameInput) {
    whereConditions.name = { contains: filterNameInput, mode: 'insensitive' };
  }
  if (filterEmailInput) {
    whereConditions.email = { contains: filterEmailInput, mode: 'insensitive' };
  }
  if (filterTeamIdInput) {
    whereConditions.userTeamId = filterTeamIdInput;
  }

  return whereConditions;
}

export function getUsersPagination(searchParams: URLSearchParams): UsersPagination {
  const pageInput = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeInput = searchParams.get('pageSize') || searchParams.get('limit') || '10';
  const pageSizeValue = parseInt(pageSizeInput, 10);
  const page = Number.isFinite(pageInput) && pageInput > 0 ? pageInput : 1;
  const pageSize = Number.isFinite(pageSizeValue) && pageSizeValue > 0 ? pageSizeValue : 10;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

function normalizeRoleFilter(role: string): string {
  const normalizedRole = role.trim().toLowerCase();
  if (normalizedRole === 'admin') {
    return 'Admin';
  }
  if (normalizedRole === 'recruiter') {
    return 'Recruiter';
  }
  if (normalizedRole === 'hiring manager') {
    return 'Hiring Manager';
  }
  if (normalizedRole === 'employee') {
    return 'Employee';
  }

  return role;
}
