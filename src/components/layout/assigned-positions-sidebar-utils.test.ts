import { describe, expect, it } from "vitest";

import {
  isAssignedPositionsRefreshEvent,
  normalizeAssignedPositionsResponse,
} from "./assigned-positions-sidebar-utils";
import type { AssignedPosition } from "./AssignedPositionsSidebarTypes";

const makePosition = (overrides: Partial<AssignedPosition> = {}): AssignedPosition => ({
  id: "position-1",
  title: "Frontend Engineer",
  department: "Engineering",
  headcount: {
    total: 2,
    vacant: 1,
    filled: 1,
  },
  ...overrides,
});

describe("assigned positions sidebar utilities", () => {
  it("normalizes missing response data to an empty list", () => {
    expect(normalizeAssignedPositionsResponse({})).toEqual([]);
    expect(normalizeAssignedPositionsResponse({ data: [makePosition()] })).toHaveLength(1);
  });

  it("detects SSE events that should refresh assigned positions", () => {
    expect(isAssignedPositionsRefreshEvent({ type: "position_update" })).toBe(true);
    expect(isAssignedPositionsRefreshEvent({ type: "dashboard_update" })).toBe(true);
    expect(isAssignedPositionsRefreshEvent({ type: "upload_queue_update" })).toBe(false);
  });
});
