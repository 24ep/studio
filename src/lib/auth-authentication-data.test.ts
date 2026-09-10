import { describe, expect, it } from "vitest";

import { normalizeAuthPermissions } from "./auth-authentication-data";

describe("auth-authentication-data", () => {
  it("normalizes permissions from stored user-group values", () => {
    expect(normalizeAuthPermissions(["POSITIONS_VIEW", "not-real", 123, null])).toEqual(
      expect.arrayContaining(["POSITIONS_VIEW"]),
    );
    expect(normalizeAuthPermissions(null)).toEqual([]);
  });
});
