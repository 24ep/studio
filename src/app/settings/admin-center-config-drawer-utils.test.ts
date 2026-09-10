import { describe, expect, it } from "vitest";

import { buildEmbeddedSettingsHref } from "./admin-center-config-drawer-utils";

describe("buildEmbeddedSettingsHref", () => {
  it("adds embedded mode to a plain internal route", () => {
    expect(buildEmbeddedSettingsHref("/settings/users")).toBe(
      "/settings/users?adminCenterEmbed=1",
    );
  });

  it("preserves existing query parameters and anchors", () => {
    expect(buildEmbeddedSettingsHref("/settings/system-settings?tab=ai#models")).toBe(
      "/settings/system-settings?tab=ai&adminCenterEmbed=1#models",
    );
  });
});
