const LOG_PREFIX = "RolePermissionSelector";

export function warnRolePermission(message: string, ...args: unknown[]) {
  console.warn(`${LOG_PREFIX}: ${message}`, ...args);
}

export function errorRolePermission(message: string, error: unknown) {
  console.error(`${LOG_PREFIX}: ${message}`, error);
}
