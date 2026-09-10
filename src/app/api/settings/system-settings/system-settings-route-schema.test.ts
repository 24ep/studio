import { describe, expect, it } from "vitest";

import { SYSTEM_SETTING_KEYS } from "./system-settings-route-keys";
import { saveSystemSettingsSchema, systemSettingKeyEnum } from "./system-settings-route-schema";

describe("system settings route schema", () => {
  it("does not define duplicate setting keys", () => {
    expect(new Set(SYSTEM_SETTING_KEYS).size).toBe(SYSTEM_SETTING_KEYS.length);
  });

  it("accepts representative settings from separate groups", () => {
    expect(systemSettingKeyEnum.safeParse("appName").success).toBe(true);
    expect(systemSettingKeyEnum.safeParse("loginPageDevToolsProtectionEnabled").success).toBe(true);
    expect(systemSettingKeyEnum.safeParse("openaiApiKey_5_lastUsed").success).toBe(true);
    expect(systemSettingKeyEnum.safeParse("deepseekApiKey_5_lastUsed").success).toBe(true);
    expect(systemSettingKeyEnum.safeParse("deepseekModelSelection").success).toBe(true);
    expect(systemSettingKeyEnum.safeParse("publicApplicationsEnabled").success).toBe(true);
    expect(systemSettingKeyEnum.safeParse("publicApplicationsRequireCaptcha").success).toBe(true);
  });

  it("validates saved setting payloads", () => {
    expect(saveSystemSettingsSchema.parse([
      { key: "appName", value: "Studio" },
      { key: "globalTwoFactorEnabled", value: "true" },
      { key: "appLogoDataUrl", value: null },
    ])).toEqual([
      { key: "appName", value: "Studio" },
      { key: "globalTwoFactorEnabled", value: "true" },
      { key: "appLogoDataUrl", value: null },
    ]);
  });
});
