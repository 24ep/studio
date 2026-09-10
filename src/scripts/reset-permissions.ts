#!/usr/bin/env tsx

/**
 * Permission reset and verification script.
 *
 * Commands:
 * - reset: filters every user group down to permissions defined in PLATFORM_MODULES
 * - verify: reports invalid database permissions and unused platform permissions
 */

import "dotenv/config";

import { getPool, type DbClient } from "@/lib/db";
import { PLATFORM_MODULES } from "@/lib/types";

import {
  getErrorMessage,
  getPermissionResetPlan,
  getPermissionVerificationResult,
  log,
  logError,
  logInfo,
  logSuccess,
  logWarning,
  type PermissionVerificationResult,
  type UserGroupPermissionRow,
} from "./permission-maintenance-utils";

type PermissionRow = {
  permission: string;
};

function getValidPermissionIds() {
  return PLATFORM_MODULES.map(module => module.id);
}

async function getUserGroups(client: DbClient) {
  const groupsResult = await client.query<UserGroupPermissionRow>(`
    SELECT id, name, permissions, "is_system_role"
    FROM "UserGroup"
    ORDER BY "is_system_role" DESC, name ASC
  `);

  return groupsResult.rows;
}

async function getDatabasePermissions(client: DbClient) {
  const dbPermissionsResult = await client.query<PermissionRow>(`
    SELECT DISTINCT unnest(permissions) as permission
    FROM "UserGroup"
    WHERE permissions IS NOT NULL AND array_length(permissions, 1) > 0
  `);

  return dbPermissionsResult.rows.map(row => row.permission);
}

async function updateGroupPermissions(client: DbClient, groupId: string, permissions: string[]) {
  await client.query(`
    UPDATE "UserGroup"
    SET permissions = $1, "updatedAt" = NOW()
    WHERE id = $2
  `, [permissions, groupId]);
}

export async function resetPermissions() {
  let client: DbClient | null = null;

  try {
    client = await getPool().connect();
    logInfo("Starting permission reset process...");

    const validPermissionIds = getValidPermissionIds();
    logInfo(`Found ${validPermissionIds.length} valid permissions in PLATFORM_MODULES`);

    const groups = await getUserGroups(client);
    logInfo(`Found ${groups.length} user groups to process`);

    let updatedGroups = 0;
    let skippedGroups = 0;

    for (const group of groups) {
      logInfo(`Processing group: ${group.name}`);

      const resetPlan = getPermissionResetPlan(group.permissions, validPermissionIds);
      if (resetPlan.invalidPermissions.length > 0) {
        logWarning(`Group "${group.name}" has ${resetPlan.invalidPermissions.length} invalid permissions: ${resetPlan.invalidPermissions.join(", ")}`);
      }

      if (resetPlan.shouldUpdate) {
        await updateGroupPermissions(client, group.id, resetPlan.validPermissions);
        logSuccess(`Updated group "${group.name}" permissions: ${resetPlan.validPermissions.length} valid permissions`);
        updatedGroups++;
      } else {
        logInfo(`Group "${group.name}" permissions are already valid`);
        skippedGroups++;
      }
    }

    logSuccess(`Permission reset completed: ${updatedGroups} groups updated, ${skippedGroups} groups skipped`);
    return true;
  } catch (error: unknown) {
    logError(`Permission reset failed: ${getErrorMessage(error)}`);
    console.error(error);
    return false;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing database client:", releaseError);
      }
    }
  }
}

function logVerificationResult(result: PermissionVerificationResult, validPermissionIds: string[], dbPermissions: string[]) {
  const validPermissionIdSet = new Set(validPermissionIds);
  const dbPermissionSet = new Set(dbPermissions);
  const invalidPermissions = dbPermissions.filter(permission => !validPermissionIdSet.has(permission));
  const unusedPermissions = validPermissionIds.filter(permission => !dbPermissionSet.has(permission));

  if (invalidPermissions.length > 0) {
    logWarning(`Found ${invalidPermissions.length} invalid permissions in database: ${invalidPermissions.join(", ")}`);
  } else {
    logSuccess("All permissions in database are valid");
  }

  if (unusedPermissions.length > 0) {
    logInfo(`Found ${unusedPermissions.length} unused permissions: ${unusedPermissions.join(", ")}`);
  } else {
    logSuccess("All PLATFORM_MODULES permissions are in use");
  }

  logInfo(
    `Permission summary: ${result.dbPermissions} database permissions, ${result.totalPermissions} platform permissions`,
  );
}

export async function verifyPermissions() {
  let client: DbClient | null = null;

  try {
    client = await getPool().connect();
    logInfo("Starting permission verification...");

    const validPermissionIds = getValidPermissionIds();
    const dbPermissions = await getDatabasePermissions(client);
    logInfo(`Found ${dbPermissions.length} unique permissions in database`);

    const result = getPermissionVerificationResult(validPermissionIds, dbPermissions);
    logVerificationResult(result, validPermissionIds, dbPermissions);

    return result;
  } catch (error: unknown) {
    logError(`Permission verification failed: ${getErrorMessage(error)}`);
    console.error(error);
    return null;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing database client:", releaseError);
      }
    }
  }
}

async function main() {
  const command = process.argv[2];

  if (command === "reset") {
    log("[START] Resetting permissions to granular format...", "cyan");
    const success = await resetPermissions();
    process.exit(success ? 0 : 1);
  }

  if (command === "verify") {
    log("[START] Verifying permission integrity...", "cyan");
    const result = await verifyPermissions();
    process.exit(result ? 0 : 1);
  }

  log("Usage:", "cyan");
  log("  tsx src/scripts/reset-permissions.ts reset   - Reset permissions to granular format", "white");
  log("  tsx src/scripts/reset-permissions.ts verify  - Verify permission integrity", "white");
  process.exit(1);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    logError(`Unexpected error: ${getErrorMessage(error)}`);
    console.error(error);
    process.exit(1);
  });
}
