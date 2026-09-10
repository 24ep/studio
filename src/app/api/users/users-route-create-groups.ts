import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { logAudit } from '@/lib/auditLog';
import prisma from '@/lib/prisma';
import type { CreateUserInput, UserRole } from './users-route-schema';
import { getCreateUserErrorMessage } from './users-route-create-errors';
import { getCreateUserRoleFromGroupName } from './users-route-create-role-utils';

export const ROLE_TO_GROUP_ID: Record<UserRole, string> = {
  Admin: '00000000-0000-0000-0000-000000000001',
  Recruiter: '00000000-0000-0000-0000-000000000002',
  'Hiring Manager': '00000000-0000-0000-0000-000000000003',
  Employee: '00000000-0000-0000-0000-000000000005',
};

export async function resolveCreateUserRoleAndGroups(input: CreateUserInput, session: Session) {
  let finalRole: UserRole = normalizeCreateUserRole(input.role);
  let finalUserGroupIds = input.userGroupIds;

  if (input.role) {
    return { finalRole, finalUserGroupIds };
  }

  const defaultUserGroup = await getOrCreateDefaultUserGroup(input.email, session);
  if (defaultUserGroup instanceof NextResponse) {
    return defaultUserGroup;
  }

  finalRole = getCreateUserRoleFromGroupName(defaultUserGroup.name);
  finalUserGroupIds = [defaultUserGroup.id];

  await logAudit(
    'INFO',
    `User ${input.email} created with default role '${finalRole}' from default group '${defaultUserGroup.name}' (ID: ${defaultUserGroup.id}).`,
    'API:Users:Create',
    session.user.id
  );

  return { finalRole, finalUserGroupIds };
}

function normalizeCreateUserRole(role?: string): UserRole {
  if (role === 'Admin' || role === 'Recruiter' || role === 'Hiring Manager' || role === 'Employee') {
    return role;
  }

  return 'Recruiter';
}

export async function resolveTargetUserGroupId(
  email: string,
  finalRole: UserRole,
  finalUserGroupIds: string[],
  session: Session
) {
  if (finalUserGroupIds.length > 0) {
    const groupId = finalUserGroupIds[0];
    const groupExists = await prisma.userGroup.findUnique({ where: { id: groupId } });
    if (groupExists) {
      return groupId;
    }

    console.error(`User group with ID ${groupId} does not exist`);
    await logAudit('ERROR', `Failed to create user ${email} - User group with ID ${groupId} does not exist.`, 'API:Users:Create', session.user.id);
    return NextResponse.json({
      message: 'Selected user group does not exist. Please contact your system administrator.',
      error: 'Missing user group',
    }, { status: 500 });
  }

  const roleGroupId = await findUserGroupIdForRole(finalRole);
  if (roleGroupId) {
    return roleGroupId;
  }

  console.error(`No valid user group ID found for user ${email}`);
  await logAudit('ERROR', `Failed to create user ${email} - No valid user group ID found.`, 'API:Users:Create', session.user.id);
  return NextResponse.json({
    message: `Unable to determine user group for role '${finalRole}'. Please contact your system administrator.`,
    error: 'No valid user group',
  }, { status: 500 });
}

async function getOrCreateDefaultUserGroup(email: string, session: Session) {
  let defaultUserGroup = await prisma.userGroup.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: 'asc' },
  });

  if (defaultUserGroup) {
    return defaultUserGroup;
  }

  defaultUserGroup = await prisma.userGroup.findFirst({
    where: { name: 'Recruiter' },
  });

  if (defaultUserGroup) {
    if (!defaultUserGroup.isDefault) {
      await prisma.userGroup.update({
        where: { id: defaultUserGroup.id },
        data: { isDefault: true },
      });
    }
    return defaultUserGroup;
  }

  try {
    return await prisma.userGroup.create({
      data: {
        id: ROLE_TO_GROUP_ID.Recruiter,
        name: 'Recruiter',
        description: 'Standard recruiter access',
        permissions: [
          'applicantS_VIEW', 'applicantS_CREATE', 'applicantS_EDIT_BASIC',
          'POSITIONS_VIEW', 'POSITIONS_CREATE', 'POSITIONS_EDIT_BASIC',
          'TASK_BOARD_VIEW', 'TASK_BOARD_MANAGE_OWN', 'DASHBOARD_VIEW',
          'USER_PREFERENCES_MANAGE_OWN',
        ],
        isDefault: true,
        isSystemRole: true,
      },
    });
  } catch (createError) {
    console.error('Failed to create Recruiter group:', createError);
    await logAudit(
      'ERROR',
      `Failed to create user ${email} - Could not create default Recruiter group. Error: ${getCreateUserErrorMessage(createError)}`,
      'API:Users:Create',
      session.user.id
    );
    return NextResponse.json({
      message: 'System configuration error. Please contact your system administrator.',
      error: 'Failed to create default user group',
    }, { status: 500 });
  }
}

async function findUserGroupIdForRole(role: UserRole): Promise<string | null> {
  const targetUserGroup = await prisma.userGroup.findFirst({
    where: {
      OR: [
        { name: role },
        { name: { contains: role, mode: 'insensitive' } },
        ...(role === 'Recruiter' ? [{ name: 'Recruiter' }] : []),
        ...(role === 'Admin' ? [{ name: 'Admin' }] : []),
        ...(role === 'Hiring Manager' ? [{ name: 'Hiring Manager' }] : []),
        ...(role === 'Employee' ? [{ name: 'Employee' }] : []),
      ],
    },
  });

  if (targetUserGroup) {
    return targetUserGroup.id;
  }

  const fallbackGroupId = ROLE_TO_GROUP_ID[role];
  const groupExists = fallbackGroupId
    ? await prisma.userGroup.findUnique({ where: { id: fallbackGroupId } })
    : null;

  return groupExists ? fallbackGroupId : null;
}
