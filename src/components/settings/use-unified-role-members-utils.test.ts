import { describe, expect, it } from "vitest";
import {
  canSubmitRoleUserAdd,
  getUnifiedRoleErrorMessage,
  getRoleUserAddPayload,
  isUnifiedRoleAbortError,
  shouldLoadAvailableRoleUsers,
  shouldLoadUnifiedRoleMembers,
} from "./use-unified-role-members-utils";

describe("use-unified-role-members-utils", () => {
  it("decides when members and available users should load", () => {
    expect(shouldLoadUnifiedRoleMembers({ activeTab: "members", isOpen: true, roleId: "role-1" })).toBe(true);
    expect(shouldLoadUnifiedRoleMembers({ activeTab: "details", isOpen: true, roleId: "role-1" })).toBe(false);
    expect(shouldLoadUnifiedRoleMembers({ activeTab: "members", isOpen: false, roleId: "role-1" })).toBe(false);

    expect(shouldLoadAvailableRoleUsers({ isAddUserModalOpen: true, roleId: "role-1" })).toBe(true);
    expect(shouldLoadAvailableRoleUsers({ isAddUserModalOpen: true, roleId: "" })).toBe(false);
  });

  it("validates add-user submissions", () => {
    expect(canSubmitRoleUserAdd({ roleId: "role-1", selectedUserId: "user-1" })).toBe(true);
    expect(canSubmitRoleUserAdd({ roleId: "role-1", selectedUserId: "" })).toBe(false);
    expect(canSubmitRoleUserAdd({ roleId: null, selectedUserId: "user-1" })).toBe(false);
    expect(getRoleUserAddPayload({ roleId: "role-1", selectedUserId: "user-1" })).toEqual({
      roleId: "role-1",
      selectedUserId: "user-1",
    });
    expect(getRoleUserAddPayload({ roleId: "", selectedUserId: "user-1" })).toBeNull();
  });

  it("normalizes abort and fallback errors", () => {
    const abortError = new Error("request aborted");
    abortError.name = "AbortError";

    expect(isUnifiedRoleAbortError(abortError)).toBe(true);
    expect(isUnifiedRoleAbortError(new Error("other"))).toBe(false);
    expect(getUnifiedRoleErrorMessage(new Error("No permission"), "Fallback")).toBe("No permission");
    expect(getUnifiedRoleErrorMessage("nope", "Fallback")).toBe("Fallback");
  });
});
