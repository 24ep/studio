import { NextResponse, type NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { clearUserValidationCache } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';
import { expandPermissionSet } from '@/lib/permission-aliases';
import { getPool } from '@/lib/db';
import prisma from '@/lib/prisma';
import { dispatchWebhooks } from '@/lib/webhooks';
import { readRequestJsonResult } from '@/lib/request-json';
import { createUserSchema, type CreateUserInput } from './users-route-schema';
import { getCreateUserErrorMessage, handleCreateUserError } from './users-route-create-errors';
import {
  resolveCreateUserRoleAndGroups,
  resolveTargetUserGroupId,
} from './users-route-create-groups';
import { resolveCreateUserPassword } from './users-route-create-password';

export async function handleCreateUser(request: NextRequest, session: Session) {
  const bodySizeError = await validateCreateUserBodySize(request);
  if (bodySizeError) {
    return bodySizeError;
  }

  const parsedBody = await parseCreateUserBody(request);
  if (parsedBody instanceof NextResponse) {
    return parsedBody;
  }

  const validationResult = createUserSchema.safeParse(parsedBody);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  return createUser(validationResult.data, session);
}

async function validateCreateUserBodySize(request: NextRequest) {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) {
    return null;
  }

  const { securityConfig } = await import('@/lib/securityConfig');
  const maxSize = securityConfig.requestBody?.maxJsonSize || 10 * 1024 * 1024;
  const size = parseInt(contentLength, 10);

  return size > maxSize
    ? NextResponse.json({
      message: `Request body too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
    }, { status: 413 })
    : null;
}

async function parseCreateUserBody(request: NextRequest): Promise<unknown | NextResponse> {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    console.error('Error parsing request body for new user:', result.error);
    return NextResponse.json({
      message: 'Error parsing request body',
      error: getCreateUserErrorMessage(result.error),
    }, { status: 400 });
  }

  return result.value;
}

async function createUser(input: CreateUserInput, session: Session) {
  const roleResolution = await resolveCreateUserRoleAndGroups(input, session);
  if (roleResolution instanceof NextResponse) {
    return roleResolution;
  }

  const hashedPassword = await resolveCreateUserPassword(input, session);
  if (hashedPassword instanceof NextResponse) {
    return hashedPassword;
  }

  try {
    const targetUserGroupId = await resolveTargetUserGroupId(
      input.email,
      roleResolution.finalRole,
      roleResolution.finalUserGroupIds,
      session
    );

    if (targetUserGroupId instanceof NextResponse) {
      return targetUserGroupId;
    }

    const userTeamId = await resolveUserTeamIdForNewUser(input);
    const newUser = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: roleResolution.finalRole || 'Recruiter',
        avatarUrl: `https://placehold.co/100x100.png?text=${input.name?.charAt(0)?.toUpperCase() || 'U'}`,
        dataAiHint: 'profile person',
        authenticationMethods: input.authenticationMethods,
        forcePasswordChange: input.forcePasswordChange,
        personalColor: input.personalColor,
        positionTitle: input.positionTitle,
        department: input.department,
        officeLocation: input.officeLocation,
        employeeType: input.employeeType,
        companyName: input.companyName,
        manager: input.manager,
        phoneNumber: input.phoneNumber,
        userGroupId: targetUserGroupId,
        userTeamId,
      },
    });

    const userGroup = await prisma.userGroup.findUnique({
      where: { id: targetUserGroupId },
      select: { id: true, name: true, permissions: true },
    });
    const userToReturn = {
      ...newUser,
      teams: userTeamId ? [userTeamId] : [],
      modulePermissions: expandPermissionSet(userGroup?.permissions || []),
    };

    clearUserValidationCache(newUser.id);

    await logAudit(
      'AUDIT',
      `User account '${userToReturn.name}' (ID: ${userToReturn.id}) created by ${session.user.name}.`,
      'API:Users:Create',
      session.user.id,
      {
        targetUserId: userToReturn.id,
        role: userToReturn.role,
        permissions: userToReturn.modulePermissions,
        groups: userToReturn.teams,
      }
    );
    await dispatchWebhooks.userCreated(newUser);

    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error: unknown) {
    return handleCreateUserError(error, input.email, session);
  }
}

async function resolveUserTeamIdForNewUser(input: CreateUserInput) {
  if (input.userTeamIds.length > 0) {
    return input.userTeamIds[0];
  }

  const matchedTeam = await findAutomaticUserTeam(input);
  return matchedTeam?.id ?? null;
}

type UserTeamCandidate = {
  id: string;
  assignmentConditions: unknown;
};

async function findAutomaticUserTeam(input: CreateUserInput): Promise<UserTeamCandidate | null> {
  const pool = await getPool().connect();

  try {
    const result = await pool.query<UserTeamCandidate>(`
      SELECT
        id,
        assignment_conditions as "assignmentConditions"
      FROM "UserTeam"
      WHERE "is_active" = true
        AND assignment_mode = 'automatic'
      ORDER BY name ASC
    `);

    const userValues = {
      department: normalizeEmployeeValue(input.department),
      officeLocation: normalizeEmployeeValue(input.officeLocation),
      positionTitle: normalizeEmployeeValue(input.positionTitle),
      employeeType: normalizeEmployeeValue(input.employeeType),
      companyName: normalizeEmployeeValue(input.companyName),
      manager: normalizeEmployeeValue(input.manager),
    };

    for (const team of result.rows) {
      const conditions = normalizeTeamConditions(team.assignmentConditions);

      const hasDepartmentMatch = !conditions.department.length
        || conditions.department.includes(userValues.department);
      const hasOfficeLocationMatch = !conditions.officeLocation.length
        || conditions.officeLocation.includes(userValues.officeLocation);
      const hasPositionMatch = !conditions.positionTitle.length
        || conditions.positionTitle.includes(userValues.positionTitle);
      const hasEmployeeTypeMatch = !conditions.employeeType.length
        || conditions.employeeType.includes(userValues.employeeType);
      const hasCompanyNameMatch = !conditions.companyName.length
        || conditions.companyName.includes(userValues.companyName);
      const hasManagerMatch = !conditions.manager.length
        || conditions.manager.includes(userValues.manager);

      if (
        hasDepartmentMatch
        && hasOfficeLocationMatch
        && hasPositionMatch
        && hasEmployeeTypeMatch
        && hasCompanyNameMatch
        && hasManagerMatch
      ) {
        return team;
      }
    }

    return null;
  } finally {
    pool.release();
  }
}

function normalizeTeamConditions(raw: unknown) {
  const parsed = typeof raw === 'string' ? safeParseTeamConditions(raw) : raw;
  return {
    department: extractConditionValues(parsed && typeof parsed === 'object' && 'department' in parsed ? parsed.department : undefined),
    officeLocation: extractConditionValues(parsed && typeof parsed === 'object' && 'officeLocation' in parsed ? parsed.officeLocation : undefined),
    positionTitle: extractConditionValues(parsed && typeof parsed === 'object' && 'positionTitle' in parsed ? parsed.positionTitle : undefined),
    employeeType: extractConditionValues(parsed && typeof parsed === 'object' && 'employeeType' in parsed ? parsed.employeeType : undefined),
    companyName: extractConditionValues(parsed && typeof parsed === 'object' && 'companyName' in parsed ? parsed.companyName : undefined),
    manager: extractConditionValues(parsed && typeof parsed === 'object' && 'manager' in parsed ? parsed.manager : undefined),
  };
}

function safeParseTeamConditions(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function extractConditionValues(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as string[];
  }

  return raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function normalizeEmployeeValue(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
