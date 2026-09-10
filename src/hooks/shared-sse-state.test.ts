import { describe, expect, it } from "vitest";

import {
  createInitialSharedSseState,
  createSharedSseEvent,
  getConnectedSharedSseState,
  getErroredSharedSseState,
  getPayloadSharedSseState,
  getSharedSseReconnectDelay,
  getTimedOutSharedSseState,
} from "./shared-sse-state";

describe("shared-sse-state", () => {
  it("creates and transitions connection states", () => {
    const initial = createInitialSharedSseState();

    expect(initial).toEqual({
      isConnected: false,
      eventCount: 0,
      lastUpdate: "Never",
      error: null,
    });

    expect(getConnectedSharedSseState(initial, "10:00")).toEqual({
      isConnected: true,
      eventCount: 0,
      lastUpdate: "10:00",
      error: null,
    });

    expect(getTimedOutSharedSseState(initial)).toEqual({
      isConnected: false,
      eventCount: 0,
      lastUpdate: "Never",
      error: "Connection timeout",
    });

    expect(getErroredSharedSseState(initial)).toEqual({
      isConnected: false,
      eventCount: 0,
      lastUpdate: "Never",
      error: "Connection error - reconnecting...",
    });
  });

  it("caps reconnect delays with exponential backoff", () => {
    expect(getSharedSseReconnectDelay(0)).toBe(3000);
    expect(getSharedSseReconnectDelay(2)).toBe(12000);
    expect(getSharedSseReconnectDelay(99)).toBe(30000);
    expect(getSharedSseReconnectDelay(-1)).toBe(3000);
  });

  it("counts only meaningful payloads and creates events", () => {
    const initial = createInitialSharedSseState();

    expect(getPayloadSharedSseState(initial, { type: "keepalive" }, "10:01").eventCount).toBe(0);
    expect(getPayloadSharedSseState(initial, { type: "position_update" }, "10:02")).toEqual({
      isConnected: false,
      eventCount: 1,
      lastUpdate: "10:02",
      error: null,
    });

    expect(createSharedSseEvent({ type: "dashboard_update" }, "message", "iso")).toEqual({
      type: "dashboard_update",
      data: { type: "dashboard_update" },
      timestamp: "iso",
    });

    expect(createSharedSseEvent({ value: 1 }, "upload_queue_update", "iso")).toEqual({
      type: "upload_queue_update",
      data: { value: 1 },
      timestamp: "iso",
    });
  });
});
