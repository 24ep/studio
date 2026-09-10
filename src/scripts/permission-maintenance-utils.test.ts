import { describe, expect, it } from "vitest";

import {
  getBasicDefaultPermissions,
  getPermissionAlignmentPlan,
  getPermissionResetPlan,
  getPermissionVerificationResult,
} from "./permission-maintenance-utils";

describe("permission-maintenance-utils", () => {
  it("keeps valid permissions and flags invalid ones", () => {
    expect(getPermissionResetPlan(["A", "OLD", "B"], ["A", "B"])).toEqual({
      validPermissions: ["A", "B"],
      invalidPermissions: ["OLD"],
      shouldUpdate: true,
    });

    expect(getPermissionResetPlan(["B", "A"], ["A", "B"]).shouldUpdate).toBe(false);
  });

  it("summarizes database permission integrity", () => {
    expect(getPermissionVerificationResult(["A", "B", "C"], ["A", "OLD"])).toEqual({
      totalPermissions: 3,
      dbPermissions: 2,
      invalidPermissions: 1,
      unusedPermissions: 2,
    });
  });

  it("keeps default permissions to basic view permissions", () => {
    expect(getBasicDefaultPermissions([
      "POSITIONS_VIEW",
      "POSITIONS_DETAILED_VIEW",
      "POSITIONS_MANAGE",
      "APPLICANTS_VIEW",
    ])).toEqual(["POSITIONS_VIEW", "APPLICANTS_VIEW"]);
  });

  it("builds an alignment plan for invalid and duplicate permissions", () => {
    expect(getPermissionAlignmentPlan({
      id: "group-1",
      name: "Recruiters",
      permissions: ["POSITIONS_VIEW", "OLD", "POSITIONS_VIEW"],
      is_system_role: false,
      is_default: false,
    }, ["POSITIONS_VIEW"])).toEqual({
      currentPermissions: ["POSITIONS_VIEW", "OLD", "POSITIONS_VIEW"],
      fixedPermissions: ["POSITIONS_VIEW"],
      invalidPermissions: ["OLD"],
      issues: ["Invalid permissions: OLD", "Duplicate permissions found"],
      shouldUpdate: true,
    });
  });

  it("fills empty system and default groups with fallback permissions", () => {
    const validPermissions = ["POSITIONS_VIEW", "POSITIONS_DETAILED_VIEW", "USERS_MANAGE"];

    expect(getPermissionAlignmentPlan({
      id: "admin",
      name: "Admin",
      permissions: [],
      is_system_role: true,
    }, validPermissions).fixedPermissions).toEqual(validPermissions);

    expect(getPermissionAlignmentPlan({
      id: "default",
      name: "Default",
      permissions: [],
      is_system_role: false,
      is_default: true,
    }, validPermissions).fixedPermissions).toEqual(["POSITIONS_VIEW"]);
  });
});
