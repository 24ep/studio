#!/usr/bin/env tsx

import "dotenv/config";

import { getPool, type DbClient } from "@/lib/db";
import { PLATFORM_MODULES } from "@/lib/types";

import {
  getErrorMessage,
  getPermissionAlignmentPlan,
  log,
  logError,
  logInfo,
  logSuccess,
  logWarning,
  type UserGroupPermissionRow,
} from "./permission-maintenance-utils";

type PermissionRow = {
  permission: string;
};

const OLD_BROAD_PERMISSIONS = [
  "applicantS_MANAGE",
  "POSITIONS_MANAGE",
  "USERS_MANAGE",
  "SYSTEM_MANAGE",
  "ADMIN",
];

function getValidPermissionIds() {
  return PLATFORM_MODULES.map(module => module.id);
}

async function getUserGroups(client: DbClient) {
  const groupsResult = await client.query<UserGroupPermissionRow>(`
    SELECT id, name, permissions, "is_system_role", "is_default"
    FROM "UserGroup"
    ORDER BY "is_system_role" DESC, "is_default" DESC, name ASC
  `);

  return groupsResult.rows;
}

async function getDistinctDatabasePermissions(client: DbClient) {
  const oldPermissionsResult = await client.query<PermissionRow>(`
    SELECT DISTINCT unnest(permissions) as permission
    FROM "UserGroup"
    WHERE permissions IS NOT NULL AND array_length(permissions, 1) > 0
  `);

  return oldPermissionsResult.rows.map(row => row.permission);
}

async function updateGroupPermissions(client: DbClient, groupId: string, permissions: string[]) {
  await client.query(
    `
      UPDATE "UserGroup"
      SET permissions = $1, "updatedAt" = NOW()
      WHERE id = $2
    `,
    [permissions, groupId],
  );
}

export async function fixPermissionAlignment() {
  let client: DbClient | null = null;

  try {
    client = await getPool().connect();
    logInfo("Starting permission alignment fix...");

    const validPermissionIds = getValidPermissionIds();
    logInfo(`Found ${validPermissionIds.length} valid permissions in PLATFORM_MODULES`);

    const groups = await getUserGroups(client);
    logInfo(`Found ${groups.length} user groups to check`);

    let fixedGroups = 0;
    let skippedGroups = 0;
    let issuesFound = 0;

    for (const group of groups) {
      logInfo(`Checking group: ${group.name}`);

      const alignmentPlan = getPermissionAlignmentPlan(group, validPermissionIds);
      if (alignmentPlan.issues.length === 0) {
        logInfo(`Group "${group.name}" has no alignment issues`);
        skippedGroups++;
        continue;
      }

      logWarning(`Group "${group.name}" has ${alignmentPlan.issues.length} issues: ${alignmentPlan.issues.join("; ")}`);
      issuesFound++;

      if (!alignmentPlan.shouldUpdate) {
        logInfo(`Group "${group.name}" permissions are already correct`);
        skippedGroups++;
        continue;
      }

      if (group.is_system_role && alignmentPlan.currentPermissions.length === 0) {
        logInfo(`Adding comprehensive permissions to system role "${group.name}"`);
      } else if (group.is_default && alignmentPlan.currentPermissions.length === 0) {
        logInfo(`Adding basic permissions to default group "${group.name}"`);
      }

      await updateGroupPermissions(client, group.id, alignmentPlan.fixedPermissions);
      logSuccess(`Fixed group "${group.name}" permissions: ${alignmentPlan.fixedPermissions.length} valid permissions`);
      fixedGroups++;
    }

    logSuccess(`Permission alignment fix completed: ${fixedGroups} groups fixed, ${skippedGroups} groups skipped, ${issuesFound} issues found`);

    return true;
  } catch (error: unknown) {
    logError(`Permission alignment fix failed: ${getErrorMessage(error)}`);
    console.error(error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function checkMigrationNeeds() {
  let client: DbClient | null = null;

  try {
    client = await getPool().connect();
    logInfo("Checking for permission migration needs...");

    const allPermissions = await getDistinctDatabasePermissions(client);
    const foundOldPermissions = allPermissions.filter(permission => OLD_BROAD_PERMISSIONS.includes(permission));

    if (foundOldPermissions.length > 0) {
      logWarning(
        `Found ${foundOldPermissions.length} old broad permissions that need migration: ${foundOldPermissions.join(", ")}`,
      );
      logInfo("These permissions should be replaced with granular permissions");
      return false;
    }

    logSuccess("No permission migration needed - all permissions are in current format");
    return true;
  } catch (error: unknown) {
    logError(`Failed to check migration needs: ${getErrorMessage(error)}`);
    console.error(error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function main() {
  log("Starting permission alignment fix...", "cyan");

  try {
    logInfo("Step 1: Checking for permission migration needs...");
    await checkMigrationNeeds();

    logInfo("Step 2: Fixing permission alignment issues...");
    const alignmentSuccess = await fixPermissionAlignment();

    if (!alignmentSuccess) {
      logWarning("Some alignment fixes failed, but continuing...");
    }

    process.exit(0);
  } catch (error: unknown) {
    logError(`Permission alignment fix failed: ${getErrorMessage(error)}`);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    logError(`Unexpected error: ${getErrorMessage(error)}`);
    console.error(error);
    process.exit(1);
  });
}
