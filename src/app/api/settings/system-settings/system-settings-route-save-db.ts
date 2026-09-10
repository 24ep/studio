import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { logAudit } from "@/lib/auditLog";
import { getPool, type DbClient } from "@/lib/db";
import { SYSTEM_SETTINGS_CACHE_TAG } from "@/lib/systemSettings";
import { applyRuntimeEnvironmentFallbacks, SAVE_ENV_MAPPINGS } from "./system-settings-route-env";
import { getErrorMessage } from "./system-settings-route-parse-save";
import {
  MASKED_SYSTEM_SETTING_VALUE,
  SECRET_SYSTEM_SETTING_KEYS,
  maskSystemSettingSecrets,
} from "@/lib/system-setting-secrets";

type SettingsToSave = Array<{
  key: string;
  value: string | null;
}>;

type SystemSettingRow = {
  key: string;
  value: string | null;
};

export async function saveValidatedSystemSettings(validatedSettings: SettingsToSave, session: Session) {
  let client: DbClient | null = null;
  try {
    client = await getPool().connect();
  } catch (connectionError) {
    console.error("[System Settings API] Failed to connect to database:", connectionError);
    return NextResponse.json({
      message: "Database connection error",
      error: getErrorMessage(connectionError),
    }, { status: 500 });
  }

  try {
    await client.query("BEGIN");

    for (const setting of validatedSettings) {
      if (
        SECRET_SYSTEM_SETTING_KEYS.has(setting.key) &&
        setting.value === MASKED_SYSTEM_SETTING_VALUE
      ) {
        continue;
      }
      await client.query<SystemSettingRow>(
        `INSERT INTO "SystemSetting" (key, value, "updatedAt")
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           "updatedAt" = NOW()
         RETURNING key, value, "updatedAt";`,
        [setting.key, setting.value],
      );
    }

    await client.query("COMMIT");
    await logAudit(
      "AUDIT",
      `System settings updated by ${session.user?.name || session.user?.email || "Unknown"}. Keys: ${validatedSettings.map(setting => setting.key).join(", ")}`,
      "API:SystemSettings:Update",
      session.user?.id,
      { updatedKeys: validatedSettings.map(setting => setting.key) },
    );

    console.log("[SYSTEM SETTINGS API] Revalidating cache...");
    revalidateTag(SYSTEM_SETTINGS_CACHE_TAG);

    const allSettingsResult = await client.query<SystemSettingRow>('SELECT key, value, "updatedAt" FROM "SystemSetting"');
    const settings = Object.fromEntries(allSettingsResult.rows.map(row => [row.key, row.value]));
    applyRuntimeEnvironmentFallbacks(settings, SAVE_ENV_MAPPINGS);

    return NextResponse.json(maskSystemSettingSecrets(settings), { status: 200 });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("[System Settings API] Error during rollback:", rollbackError);
      }
    }
    console.error("Failed to save system settings:", error);
    const errorMessage = getErrorMessage(error);
    await logAudit(
      "ERROR",
      `Failed to save system settings by ${session?.user?.name || session?.user?.email || "Unknown"}. Error: ${errorMessage}`,
      "API:SystemSettings:Update",
      session?.user?.id,
    );
    return NextResponse.json({ message: "Error saving system settings", error: errorMessage }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
