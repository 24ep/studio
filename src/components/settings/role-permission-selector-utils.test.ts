import { describe, expect, it, vi } from "vitest";

import type { PlatformModule } from "@/lib/types";
import {
  buildPermissionGroupsFromModules,
  clearCategoryPermissionIds,
  clearPermissionsWithProtection,
  filterPermissionGroups,
  getCategoryPermissionIds,
  getValidPermissionModules,
  normalizePermissionIds,
  selectCategoryPermissionIds,
  togglePermissionId,
} from "./role-permission-selector-utils";

const modules = [
  { id: "applicant.view", label: "View Applicants", category: "Applicants" },
  { id: "applicant.edit", label: "Edit Applicants", category: "Applicants" },
  { id: "settings.view", label: "View Settings", category: "Settings" },
] as unknown as PlatformModule[];

describe("role permission selector utilities", () => {
  it("normalizes permission ids and filters invalid module entries", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(normalizePermissionIds(["applicant.view", "", 10], "selectedPermissions"))
      .toEqual(["applicant.view"]);
    expect(getValidPermissionModules([...modules, null, { id: "", category: "Broken" }]))
      .toEqual(modules);

    warnSpy.mockRestore();
  });

  it("builds and filters grouped permissions", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const groups = buildPermissionGroupsFromModules(
      { applicants: "Applicants", settings: "Settings" },
      modules,
    );

    expect(buildPermissionGroupsFromModules(null, modules)).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "RolePermissionSelector: PLATFORM_MODULE_CATEGORIES is not available:",
      null,
    );
    expect(groups).toHaveLength(2);
    expect(groups[0].permissions).toHaveLength(2);
    expect(filterPermissionGroups(groups, "settings")).toEqual([
      {
        category: "Settings",
        permissions: [modules[2]],
      },
    ]);

    warnSpy.mockRestore();
  });

  it("selects, clears, toggles, and protects permission ids", () => {
    const applicantIds = getCategoryPermissionIds(modules, "Applicants");

    expect(selectCategoryPermissionIds(["settings.view"], applicantIds))
      .toEqual(["settings.view", "applicant.view", "applicant.edit"]);
    expect(clearCategoryPermissionIds(
      ["settings.view", "applicant.view", "applicant.edit"],
      ["applicant.view"],
      applicantIds,
    )).toEqual(["settings.view", "applicant.view"]);
    expect(clearCategoryPermissionIds(
      ["applicant.view", "applicant.edit"],
      ["applicant.edit"],
      applicantIds,
    )).toEqual(["applicant.edit"]);
    expect(togglePermissionId(["applicant.view"], ["applicant.view"], "applicant.view"))
      .toEqual(["applicant.view"]);
    expect(togglePermissionId(["applicant.view"], [], "applicant.view")).toEqual([]);
    expect(togglePermissionId([], [], "applicant.edit")).toEqual(["applicant.edit"]);
    expect(clearPermissionsWithProtection(["applicant.view", "settings.view"], ["settings.view"]))
      .toEqual(["settings.view"]);
  });
});
