import { describe, expect, it } from "vitest";

import type { SidebarNavGroup, SidebarNavItem } from "./SidebarNavConfig";
import {
  MEGA_MENU_CATEGORIES,
  buildAdminCenterMegaMenuGroups,
  getCategoryFirstHref,
  slugHeaderNavigationText,
} from "./header-navigation-config";

const Icon = () => null;

function item(label: string, href: string): SidebarNavItem {
  return { label, href, icon: Icon };
}

describe("header navigation config", () => {
  it("keeps ESS, Workforce, and Leave as separate primary destinations", () => {
    expect(MEGA_MENU_CATEGORIES.map(category => category.label)).toEqual([
      "Home",
      "People",
      "ESS",
      "Workforce",
      "Leave",
      "Pay",
      "Hiring",
      "Growth",
      "Admin",
    ]);

    expect(MEGA_MENU_CATEGORIES.find(category => category.label === "ESS")?.groupIds).toEqual(["ess"]);
    expect(MEGA_MENU_CATEGORIES.find(category => category.label === "Workforce")?.groupIds).toEqual(["workforce"]);
    expect(MEGA_MENU_CATEGORIES.find(category => category.label === "Leave")?.groupIds).toEqual(["leaves"]);
  });

  it("normalizes labels for localization keys", () => {
    expect(slugHeaderNavigationText("Audit, Logs & Monitoring")).toBe(
      "audit-logs-and-monitoring",
    );
  });

  it("uses the first home destination as-is", () => {
    expect(
      getCategoryFirstHref({
        label: "Home",
        items: [
          item("Admin Portal", "/dashboard"),
          item("Employee Portal", "/employee-portal"),
        ],
      }),
    ).toBe("/dashboard");
  });

  it("skips employee portal as the default destination for non-home categories", () => {
    expect(
      getCategoryFirstHref({
        label: "People",
        items: [
          item("Employee Portal", "/employee-portal"),
          item("Employees", "/people"),
        ],
      }),
    ).toBe("/people");
  });

  it("splits the admin-center group into stable columns while preserving other admin groups", () => {
    const adminGroup: SidebarNavGroup = {
      id: "admin-center",
      label: "Admin Center",
      icon: Icon,
      items: Array.from({ length: 13 }, (_, index) =>
        item(`Item ${index + 1}`, `/settings/${index + 1}`),
      ),
    };
    const analyticsGroup: SidebarNavGroup = {
      id: "data-and-analytics",
      label: "Data & Analytics",
      icon: Icon,
      items: [item("Import", "/data-operations?mode=import")],
    };

    const groups = buildAdminCenterMegaMenuGroups("Admin", [adminGroup, analyticsGroup]);

    expect(groups.map(group => group.label)).toEqual([
      "Workspace",
      "Platform controls",
      "Integrations & oversight",
      "Data & Analytics",
    ]);
    expect(groups.map(group => group.items.length)).toEqual([5, 5, 3, 1]);
  });
});
