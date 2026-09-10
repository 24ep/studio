import { describe, expect, it } from "vitest";

import { parseHeadcountBulkActionInput } from "./headcount-bulk-utils";

describe("parseHeadcountBulkActionInput", () => {
  it("normalizes a valid approval batch", () => {
    expect(
      parseHeadcountBulkActionInput({
        ids: [" hc-1 ", "hc-2", "hc-1"],
        action: "approve",
      }),
    ).toEqual({
      ok: true,
      value: { ids: ["hc-1", "hc-2"], action: "approve" },
    });
  });

  it("requires at least one request", () => {
    expect(parseHeadcountBulkActionInput({ ids: [], action: "approve" })).toEqual({
      ok: false,
      message: "Select at least one headcount request.",
    });
  });

  it("rejects unsupported actions", () => {
    expect(
      parseHeadcountBulkActionInput({ ids: ["hc-1"], action: "submit" }),
    ).toEqual({
      ok: false,
      message: "Bulk action must be approve or reject.",
    });
  });

  it("requires a reason for bulk rejection", () => {
    expect(
      parseHeadcountBulkActionInput({ ids: ["hc-1"], action: "reject", reason: " " }),
    ).toEqual({
      ok: false,
      message: "Rejection reason is required.",
    });
  });

  it("limits a batch to one hundred unique requests", () => {
    expect(
      parseHeadcountBulkActionInput({
        ids: Array.from({ length: 101 }, (_, index) => `hc-${index}`),
        action: "approve",
      }),
    ).toEqual({
      ok: false,
      message: "Bulk actions are limited to 100 requests at a time.",
    });
  });
});
