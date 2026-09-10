import { describe, expect, it } from "vitest";

import {
  getUnifiedRoleMemberInitials,
  getUnifiedRoleMembersPage,
  type UnifiedRoleMember,
} from "./unified-role-members-utils";

const members: UnifiedRoleMember[] = [
  {
    id: "user-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "Admin",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "user-2",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "Reviewer",
    createdAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "user-3",
    name: "Katherine Johnson",
    email: "kj@example.com",
    role: "Reviewer",
    createdAt: "2024-01-03T00:00:00.000Z",
  },
];

describe("unified-role-members-utils", () => {
  it("builds stable initials from names", () => {
    expect(getUnifiedRoleMemberInitials("Ada Lovelace")).toBe("AL");
    expect(getUnifiedRoleMemberInitials("  Grace   Hopper  ")).toBe("GH");
    expect(getUnifiedRoleMemberInitials("Katherine")).toBe("K");
  });

  it("filters members by name or email and paginates the result", () => {
    const page = getUnifiedRoleMembersPage({
      members,
      page: 1,
      perPage: 2,
      searchTerm: "example",
    });

    expect(page.totalFilteredMembers).toBe(3);
    expect(page.totalPages).toBe(2);
    expect(page.startIndex).toBe(0);
    expect(page.paginatedMembers.map((member) => member.id)).toEqual([
      "user-1",
      "user-2",
    ]);
  });

  it("ignores malformed member records before searching", () => {
    const page = getUnifiedRoleMembersPage({
      members: [
        ...members,
        { ...members[0], id: "" },
        { ...members[0], name: "" },
      ],
      page: 1,
      perPage: 10,
      searchTerm: "ada",
    });

    expect(page.filteredMembers.map((member) => member.id)).toEqual(["user-1"]);
  });
});
