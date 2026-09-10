import { describe, expect, it } from "vitest";

import { getEffectiveSidebarLogoSize, selectSidebarLogoUrl } from "./sidebar-header-content-utils";

describe("sidebar header content utilities", () => {
  it("selects contextual logos before falling back to the default logo", () => {
    expect(selectSidebarLogoUrl({
      appLogoUrl: "/default.png",
      contextualLogos: {
        sidebarLogoCollapsedDarkMode: "/collapsed-dark.png",
        sidebarLogoExpandedLightMode: "/expanded-light.png",
      },
      isCollapsed: true,
      isDarkMode: true,
    })).toBe("/collapsed-dark.png");

    expect(selectSidebarLogoUrl({
      appLogoUrl: "/default.png",
      contextualLogos: {},
      isCollapsed: false,
      isDarkMode: false,
    })).toBe("/default.png");
  });

  it("caps collapsed logo size without changing expanded size", () => {
    expect(getEffectiveSidebarLogoSize({
      isCollapsed: true,
      sidebarLogoSize: 120,
      collapsedSidebarLogoSize: 80,
    })).toBe(64);
    expect(getEffectiveSidebarLogoSize({
      isCollapsed: false,
      sidebarLogoSize: 120,
      collapsedSidebarLogoSize: 80,
    })).toBe(120);
  });
});
