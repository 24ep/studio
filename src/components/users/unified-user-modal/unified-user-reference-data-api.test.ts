import { describe, expect, it } from "vitest";

import {
  normalizeUnifiedUserCustomFieldDefinitions,
  normalizeUnifiedUserGroups,
  normalizeUnifiedUserTeams,
} from "./unified-user-reference-data-api";

describe("unified user reference data api utilities", () => {
  it("normalizes valid user groups and drops malformed entries", () => {
    expect(normalizeUnifiedUserGroups([
      {
        id: "admin",
        name: "Admin",
        description: "System admin",
        permissions: ["users:read", 123],
        isDefault: true,
        isSystemRole: false,
        user_count: 2,
      },
      { id: "missing-name" },
      "bad",
    ])).toEqual([
      {
        id: "admin",
        name: "Admin",
        description: "System admin",
        permissions: ["users:read"],
        isDefault: true,
        isSystemRole: false,
        user_count: 2,
        createdAt: undefined,
        updatedAt: undefined,
      },
    ]);
  });

  it("normalizes user teams with optional colors", () => {
    expect(normalizeUnifiedUserTeams([
      { id: "team-1", name: "Talent", color: "#00aaff" },
      { id: "team-2" },
      null,
    ])).toEqual([
      { id: "team-1", name: "Talent", color: "#00aaff" },
    ]);
  });

  it("returns arrays for custom field definitions only", () => {
    expect(normalizeUnifiedUserCustomFieldDefinitions([{ id: "field-1" }])).toEqual([{ id: "field-1" }]);
    expect(normalizeUnifiedUserCustomFieldDefinitions({ id: "field-1" })).toEqual([]);
  });
});
