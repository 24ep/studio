import { describe, expect, it } from "vitest";

import {
  escapeODataString,
  findExactEmailMatch,
  mapGraphUserToLookupResponse,
  type GraphUser,
} from "./lookup-ad-graph";

describe("lookup-ad graph helpers", () => {
  it("escapes single quotes for OData filters", () => {
    expect(escapeODataString("o'connor@example.com")).toBe("o''connor@example.com");
  });

  it("prefers exact email matches over the first partial result", () => {
    const users: GraphUser[] = [
      { id: "partial", mail: "ada.lovelace@example.com" },
      { id: "exact", userPrincipalName: "ada@example.com" },
    ];

    expect(findExactEmailMatch(users, "ada@example.com")?.id).toBe("exact");
  });

  it("maps optional Graph profile fields to the API response shape", () => {
    expect(mapGraphUserToLookupResponse({
      id: "user-1",
      displayName: "Ada",
      mail: null,
      userPrincipalName: "ada@example.com",
      jobTitle: undefined,
      department: "Engineering",
      officeLocation: undefined,
      mobilePhone: null,
      businessPhones: null,
      accountEnabled: true,
    })).toEqual({
      id: "user-1",
      displayName: "Ada",
      email: "ada@example.com",
      userPrincipalName: "ada@example.com",
      jobTitle: null,
      department: "Engineering",
      officeLocation: null,
      mobilePhone: null,
      businessPhones: [],
      accountEnabled: true,
    });
  });
});
