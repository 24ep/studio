import { describe, expect, it } from "vitest";
import { getHeaderUserMenuLabels } from "./header-user-menu-i18n";

describe("getHeaderUserMenuLabels", () => {
  it("returns Thai labels for Thai locale variants", () => {
    expect(getHeaderUserMenuLabels("th-TH").signOut).toBe("ออกจากระบบ");
    expect(getHeaderUserMenuLabels("th").myProfile).toBe("โปรไฟล์ของฉัน");
  });

  it("defaults to English for missing and unsupported locales", () => {
    expect(getHeaderUserMenuLabels().signOut).toBe("Sign Out");
    expect(getHeaderUserMenuLabels("en-US").appearance).toBe("Appearance");
    expect(getHeaderUserMenuLabels("ja-JP").settings).toBe("Admin Center");
  });
});
