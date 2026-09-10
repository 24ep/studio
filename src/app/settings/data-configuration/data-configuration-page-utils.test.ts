import { describe, expect, it } from "vitest";

import { getLegacyDataConfigurationRoute } from "./data-configuration-page-utils";

describe("data-configuration-page-utils", () => {
  it("redirects every legacy section to its standalone configuration page", () => {
    expect(getLegacyDataConfigurationRoute("company-references")).toBe("/settings/company-references");
    expect(getLegacyDataConfigurationRoute("position-grades")).toBe("/settings/grades");
    expect(getLegacyDataConfigurationRoute("recruitment-stages")).toBe("/settings/stages");
    expect(getLegacyDataConfigurationRoute("unknown")).toBe("/settings");
    expect(getLegacyDataConfigurationRoute()).toBe("/settings");
  });
});
