import { describe, expect, it } from "vitest";

import {
  filterAllowedSystemSettings,
  getSystemSettingCategory,
  groupSystemSettingsByCategory,
  renderSystemSettingValue,
} from "./system-settings-table-utils";
import type { SystemSetting } from "@/lib/types";

function setting(key: string, value: string | null = "value"): SystemSetting {
  return {
    key: key as SystemSetting["key"],
    value,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("system-settings-table-utils", () => {
  it("filters to allowed settings", () => {
    const appNameSetting = setting("appName");

    expect(filterAllowedSystemSettings([
      appNameSetting,
      setting("unknownKey"),
    ])).toEqual([appNameSetting]);
  });

  it("renders setting values defensively", () => {
    expect(renderSystemSettingValue(null)).toBe("Not set");
    expect(renderSystemSettingValue("hello")).toBe("hello");
  });

  it("categorizes and groups settings", () => {
    expect(getSystemSettingCategory("appName")).toBe("Application");
    expect(getSystemSettingCategory("loginPageContent")).toBe("Login Page");
    expect(getSystemSettingCategory("sidebarTextL")).toBe("Sidebar");
    expect(getSystemSettingCategory("generalPdfWebhookUrl")).toBe("Webhooks");
    expect(getSystemSettingCategory("pwaEnabled")).toBe("General");

    expect(groupSystemSettingsByCategory([
      setting("appName"),
      setting("loginPageContent"),
    ])).toEqual({
      Application: [setting("appName")],
      "Login Page": [setting("loginPageContent")],
    });
  });
});
