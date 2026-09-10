import { afterEach, describe, expect, it, vi } from "vitest";

import type { HrCrudRecord } from "./hr-crud";
import {
  accountAccessStatus,
  accountLinkStatus,
  compactValue,
  employeeDisplayName,
  employeeEditForm,
  employeeRecordReference,
  employmentTenure,
  formatLabel,
  formatValue,
  jsonItems,
  normalizedHttpUrl,
  objectEntries,
  readableJsonValue,
} from "./employee-profile-model";

describe("employee profile model", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats labels and values for profile display", () => {
    expect(formatLabel("personal_email")).toBe("Personal email");
    expect(formatLabel("profileCompletion")).toBe("Profile Completion");
    expect(formatValue(undefined)).toBe("Not set");
    expect(formatValue(true)).toBe("Yes");
    expect(formatValue("active_employee")).toBe("active employee");
    expect(compactValue(undefined)).toBe("—");
  });

  it("creates compact record references for long employee ids", () => {
    expect(employeeRecordReference("short-id")).toBe("short-id");
    expect(employeeRecordReference("123456789012345678901234567890")).toBe(
      "1234567890…4567890",
    );
  });

  it("calculates stable employment tenure", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T00:00:00.000Z"));
    expect(employmentTenure("2025-08-23")).toBe("1 year of employment");
    expect(employmentTenure("2026-06-23")).toBe("2 months of employment");
    expect(employmentTenure("invalid")).toBeNull();
  });

  it("normalizes structured values and safe urls", () => {
    expect(jsonItems([1, 2])).toEqual([1, 2]);
    expect(jsonItems({})).toEqual([]);
    expect(objectEntries({ a: 1 })).toEqual([["a", 1]]);
    expect(objectEntries([])).toEqual([]);
    expect(readableJsonValue({ preferred_name: "Poo", active: true })).toBe(
      "Preferred name: Poo · Active: Yes",
    );
    expect(normalizedHttpUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(normalizedHttpUrl("javascript:alert(1)")).toBeNull();
  });

  it("derives account and employee display state", () => {
    const unlinked = {
      id: "employee-1",
      firstName: "Jane",
      lastName: "Doe",
    } as HrCrudRecord;
    expect(accountLinkStatus(unlinked)).toBe("No matching account");
    expect(accountAccessStatus(unlinked)).toBe("Unlinked");
    expect(employeeDisplayName(unlinked)).toBe("Jane Doe");
    expect(employeeDisplayName(null)).toBe("Employee profile");

    const invited = {
      ...unlinked,
      accountUserId: "u1",
      accountLinkedByEmail: true,
      accountForcePasswordChange: true,
    } as HrCrudRecord;
    expect(accountLinkStatus(invited)).toBe("Matched by email");
    expect(accountAccessStatus(invited)).toBe("Invited");
  });

  it("maps employee data into the existing edit-form shape", () => {
    const employee = {
      id: "employee-1",
      employeeNumber: "E001",
      firstName: "Jane",
      lastName: "Doe",
      employmentType: "full_time",
      status: "active",
      hireDate: "2026-01-15T00:00:00.000Z",
      accountIsActive: true,
      contractNoticeDays: 30,
      profileCompletion: 80,
      personProfile: {
        preferred_name: "JD",
        email: "jane.personal@example.com",
      },
      skills: ["SQL"],
    } as HrCrudRecord;

    const form = employeeEditForm(employee);
    expect(form.employeeNumber).toBe("E001");
    expect(form.preferredName).toBe("JD");
    expect(form.personalEmail).toBe("jane.personal@example.com");
    expect(form.hireDate).toBe("2026-01-15");
    expect(form.contractNoticeDays).toBe("30");
    expect(form.profileCompletion).toBe("80");
    expect(JSON.parse(form.jsonFields.skills)).toEqual(["SQL"]);
  });
});
