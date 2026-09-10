import bcrypt from 'bcryptjs';
import { clearUserValidationCache } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE_TO_GROUP_ID, type UpdateUserInput } from './user-detail-schema';

const USER_DETAIL_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  personalColor: true,
  authenticationMethods: true,
  forcePasswordChange: true,
  createdAt: true,
  updatedAt: true,
  userGroupId: true,
  userTeamId: true,
  positionTitle: true,
  department: true,
  phoneNumber: true,
  officeLocation: true,
  employeeId: true,
  companyName: true,
  employeeType: true,
  hireDate: true,
  manager: true,
  samAccountName: true,
  contactInfo: true,
  deletedFromAD: true,
  isActive: true,
  twoFactorEnabled: true,
  twoFactorMethod: true,
};

export async function getUserWithGroupTeam(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_DETAIL_SELECT,
  });

  if (!user) {
    return null;
  }

  return enrichUserWithGroupTeam(user);
}

export async function updateUserById(id: string, input: UpdateUserInput) {
  const updatedUser = await prisma.user.update({
    where: { id },
    data: await buildUserUpdateData(input),
  });

  clearUserValidationCache(id);
  return enrichUserWithGroupTeam(updatedUser);
}

export async function deleteUserById(id: string) {
  const deletedUser = await prisma.user.delete({
    where: { id },
    select: { id: true, name: true },
  });

  clearUserValidationCache(id);
  return deletedUser;
}

export function hasUserUpdatePayload(input: UpdateUserInput) {
  const { password, newPassword, userTeamIds, userGroupIds, role, customFields, ...profileFields } = input;

  return Object.keys(profileFields).length > 0
    || Boolean(password)
    || Boolean(newPassword?.trim())
    || userTeamIds !== undefined
    || userGroupIds !== undefined
    || role !== undefined
    || Boolean(customFields);
}

async function buildUserUpdateData(input: UpdateUserInput) {
  const { password, newPassword, userTeamIds, userGroupIds, role, customFields: _customFields, ...profileFields } = input;
  const updateData: Record<string, unknown> = {
    ...profileFields,
    ...(role !== undefined && { role }),
  };

  const passwordToHash = newPassword?.trim() ? newPassword : password;
  if (passwordToHash) {
    updateData.password = await bcrypt.hash(passwordToHash, 10);
  }

  if (userGroupIds !== undefined || role !== undefined) {
    updateData.userGroupId = resolveUserGroupId(userGroupIds, role);
  }

  if (userTeamIds !== undefined) {
    updateData.userTeamId = userTeamIds.length > 0 ? userTeamIds[0] : null;
  }

  return updateData;
}

function resolveUserGroupId(userGroupIds: string[] | undefined, role: UpdateUserInput['role']) {
  if (userGroupIds !== undefined && userGroupIds.length > 0) {
    return userGroupIds[0];
  }

  return role ? USER_ROLE_TO_GROUP_ID[role] : null;
}

async function enrichUserWithGroupTeam<T extends { userGroupId: string | null; userTeamId: string | null }>(user: T) {
  const [userGroup, userTeam] = await Promise.all([
    user.userGroupId
      ? prisma.userGroup.findUnique({
        where: { id: user.userGroupId },
        select: { id: true, name: true, permissions: true },
      })
      : null,
    user.userTeamId
      ? prisma.userTeam.findUnique({
        where: { id: user.userTeamId },
        select: { id: true, name: true, color: true },
      })
      : null,
  ]);

  return {
    ...user,
    teams: userTeam ? [userTeam] : [],
    modulePermissions: userGroup?.permissions || [],
  };
}
