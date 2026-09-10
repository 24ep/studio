import { describe, expect, it } from "vitest";

import type { Position } from "@/lib/types";
import {
  normalizeArrayPayload,
  normalizeRecruiterOptions,
  updatePositionCustomField,
} from "./position-detail-base-data-utils";

describe("position-detail-base-data-utils", () => {
  it("normalizes array and recruiter payloads", () => {
    expect(normalizeArrayPayload<number>([1, 2])).toEqual([1, 2]);
    expect(normalizeArrayPayload<number>({ bad: true })).toEqual([]);

    expect(normalizeRecruiterOptions({
      users: [
        { id: "user-1", name: "Ada", email: "ada@example.test" },
        { id: "user-2", email: "grace@example.test" },
        { id: "user-3" },
        { name: "No id" },
      ],
    })).toEqual([
      { id: "user-1", name: "Ada" },
      { id: "user-2", name: "grace@example.test" },
      { id: "user-3", name: "user-3" },
    ]);
  });

  it("updates position custom fields immutably", () => {
    const position = {
      id: "position-1",
      customFields: { level: "senior" },
    } as unknown as Position;

    expect(updatePositionCustomField(position, "priority", "high")).toMatchObject({
      id: "position-1",
      customFields: {
        level: "senior",
        priority: "high",
      },
    });

    expect(updatePositionCustomField(null, "priority", "high")).toBeNull();
  });
});
