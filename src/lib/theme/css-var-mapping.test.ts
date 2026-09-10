import { describe, expect, it } from "vitest";

import { cssVarMapping, primaryButtonShadowMapping } from "./css-var-mapping";

describe("css-var-mapping", () => {
  it("maps sidebar settings to matching light and dark CSS variables", () => {
    expect(cssVarMapping.sidebarBgStartL).toBe("--sidebar-background-start-l");
    expect(cssVarMapping.sidebarBgStartD).toBe("--sidebar-background-start-d");
    expect(cssVarMapping.sidebarGroupLabelMarginL).toBe("--sidebar-group-label-margin-l");
    expect(cssVarMapping.sidebarGroupLabelMarginD).toBe("--sidebar-group-label-margin-d");
  });

  it("keeps button text and primary shadow variables exported", () => {
    expect(cssVarMapping.buttonTextColorL).toBe("--button-text-color-l");
    expect(cssVarMapping.buttonTextColorD).toBe("--button-text-color-d");
    expect(primaryButtonShadowMapping.primaryButtonShadowHoverD).toBe("--primary-button-shadow-hover-d");
  });
});
