export type UserGroupPermissionRow = {
  id: string;
  name: string;
  permissions: string[] | null;
  is_system_role: boolean;
  is_default?: boolean;
};

export type PermissionVerificationResult = {
  totalPermissions: number;
  dbPermissions: number;
  invalidPermissions: number;
  unusedPermissions: number;
};

export type PermissionAlignmentPlan = {
  currentPermissions: string[];
  fixedPermissions: string[];
  invalidPermissions: string[];
  issues: string[];
  shouldUpdate: boolean;
};

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

export function log(message: string, color: keyof typeof colors = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logSuccess(message: string) {
  log(`[OK] ${message}`, "green");
}

export function logWarning(message: string) {
  log(`[WARN] ${message}`, "yellow");
}

export function logError(message: string) {
  log(`[ERROR] ${message}`, "red");
}

export function logInfo(message: string) {
  log(`[INFO] ${message}`, "blue");
}

export function getPermissionResetPlan(
  currentPermissions: string[] | null,
  validPermissionIds: string[],
) {
  const current = currentPermissions ?? [];
  const validPermissionIdSet = new Set(validPermissionIds);
  const validPermissions = current.filter(permission => validPermissionIdSet.has(permission));
  const invalidPermissions = current.filter(permission => !validPermissionIdSet.has(permission));
  const shouldUpdate = JSON.stringify([...validPermissions].sort()) !== JSON.stringify([...current].sort());

  return {
    validPermissions,
    invalidPermissions,
    shouldUpdate,
  };
}

export function getPermissionVerificationResult(validPermissionIds: string[], dbPermissions: string[]): PermissionVerificationResult {
  const validPermissionIdSet = new Set(validPermissionIds);
  const dbPermissionSet = new Set(dbPermissions);
  const invalidPermissions = dbPermissions.filter(permission => !validPermissionIdSet.has(permission));
  const unusedPermissions = validPermissionIds.filter(permission => !dbPermissionSet.has(permission));

  return {
    totalPermissions: validPermissionIds.length,
    dbPermissions: dbPermissions.length,
    invalidPermissions: invalidPermissions.length,
    unusedPermissions: unusedPermissions.length,
  };
}

export function getBasicDefaultPermissions(validPermissionIds: string[]) {
  return validPermissionIds.filter(permission => permission.includes("_VIEW") && !permission.includes("_DETAILED"));
}

export function getPermissionAlignmentPlan(
  group: UserGroupPermissionRow,
  validPermissionIds: string[],
): PermissionAlignmentPlan {
  const validPermissionIdSet = new Set(validPermissionIds);
  const currentPermissions = group.permissions ?? [];
  const uniquePermissions = [...new Set(currentPermissions)];
  const invalidPermissions = currentPermissions.filter(permission => !validPermissionIdSet.has(permission));
  const issues: string[] = [];

  if (invalidPermissions.length > 0) {
    issues.push(`Invalid permissions: ${[...new Set(invalidPermissions)].join(", ")}`);
  }

  if (uniquePermissions.length !== currentPermissions.length) {
    issues.push("Duplicate permissions found");
  }

  if (group.is_system_role && currentPermissions.length === 0) {
    issues.push("System role has no permissions");
  }

  if (group.is_default && currentPermissions.length === 0) {
    issues.push("Default group has no permissions");
  }

  let fixedPermissions = uniquePermissions.filter(permission => validPermissionIdSet.has(permission));

  if (group.is_system_role && fixedPermissions.length === 0) {
    fixedPermissions = validPermissionIds;
  } else if (group.is_default && fixedPermissions.length === 0) {
    fixedPermissions = getBasicDefaultPermissions(validPermissionIds);
  }

  return {
    currentPermissions,
    fixedPermissions,
    invalidPermissions,
    issues,
    shouldUpdate: JSON.stringify([...fixedPermissions].sort()) !== JSON.stringify([...currentPermissions].sort()),
  };
}
