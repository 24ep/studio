import type { PoolClient } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SINGLE_CONNECTION_SLOW_OPERATION_MS,
  buildSingleConnectionStatus,
  isSlowSingleConnectionOperation,
  logSlowSingleConnectionOperation,
  startSingleConnectionKeepAlive,
} from "./single-connection-manager-utils";

describe("single-connection-manager-utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("detects slow operations above the threshold", () => {
    expect(isSlowSingleConnectionOperation(SINGLE_CONNECTION_SLOW_OPERATION_MS)).toBe(false);
    expect(isSlowSingleConnectionOperation(SINGLE_CONNECTION_SLOW_OPERATION_MS + 1)).toBe(true);
    expect(isSlowSingleConnectionOperation(50, 25)).toBe(true);
  });

  it("logs slow operations", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    logSlowSingleConnectionOperation("sample", SINGLE_CONNECTION_SLOW_OPERATION_MS);
    expect(warnSpy).not.toHaveBeenCalled();

    logSlowSingleConnectionOperation("sample", SINGLE_CONNECTION_SLOW_OPERATION_MS + 1);
    expect(warnSpy).toHaveBeenCalledWith(
      `[SINGLE CONNECTION] Slow operation 'sample': ${SINGLE_CONNECTION_SLOW_OPERATION_MS + 1}ms`
    );
  });

  it("builds connection status with idle seconds", () => {
    expect(buildSingleConnectionStatus({
      isConnected: true,
      hasClient: true,
      lastUsed: 1_000,
      poolSize: 1,
    }, 6_500)).toEqual({
      isConnected: true,
      hasClient: true,
      lastUsed: 1_000,
      idleSeconds: 6,
      poolSize: 1,
    });
  });

  it("runs keep-alive against the active client", async () => {
    vi.useFakeTimers();
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    const interval = startSingleConnectionKeepAlive({
      getClient: () => ({ query } as unknown as PoolClient),
      isConnected: () => true,
      onSuccess,
      onFailure,
      intervalMs: 10,
    });

    await vi.advanceTimersByTimeAsync(10);

    expect(query).toHaveBeenCalledWith("SELECT 1");
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();

    clearInterval(interval);
  });
});
