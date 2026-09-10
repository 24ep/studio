import { NextResponse, type NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { logAudit } from '@/lib/auditLog';
import {
  UsersTableMissingError,
  buildUsersWhereConditions,
  enrichUsersForList,
  findUserIdsOnly,
  findUsersForList,
  getUsersPagination,
  getUsersTotalCount,
} from './users-route-list-query';

export async function handleGetUsers(request: NextRequest, session: Session) {
  const { searchParams } = new URL(request.url);
  const pagination = getUsersPagination(searchParams);
  const whereConditions = buildUsersWhereConditions(searchParams, session);

  try {
    if (searchParams.get('idsOnly') === 'true') {
      const userIds = await findUserIdsOnly(whereConditions);
      return NextResponse.json({
        ids: userIds,
        totalCount: userIds.length,
      });
    }

    const totalCount = await getUsersTotalCount(whereConditions);
    const users = await findUsersForList(whereConditions, pagination);
    const usersToReturn = await enrichUsersForList(users, session);

    return NextResponse.json({
      users: usersToReturn,
      pagination: {
        currentPage: pagination.page,
        totalPages: Math.ceil(totalCount / pagination.pageSize),
        totalCount,
        pageSize: pagination.pageSize,
      },
    }, { status: 200 });
  } catch (error) {
    return handleGetUsersError(error, session);
  }
}

async function handleGetUsersError(error: unknown, session: Session) {
  if (error instanceof UsersTableMissingError) {
    return NextResponse.json({
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        pageSize: 10,
      },
    }, { status: 200 });
  }

  console.error('Failed to fetch users (Prisma Error):', error);
  const userNameForLog = session?.user?.name || session?.user?.email || 'Unknown User';
  await logAudit(
    'ERROR',
    `Failed to fetch users by ${userNameForLog}. Prisma Error: ${error instanceof Error ? error.message : String(error)}`,
    'API:Users:Get',
    session.user.id
  );

  return NextResponse.json({
    message: 'Error fetching users due to a server-side database error.',
    ...(process.env.NODE_ENV === 'development' && {
      error: error instanceof Error ? error.message : String(error),
    }),
  }, { status: 500 });
}
