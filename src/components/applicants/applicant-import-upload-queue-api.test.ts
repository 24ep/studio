import { describe, expect, it, vi } from "vitest";

import {
  deleteUploadQueueItem,
  fetchUploadQueueData,
  fetchUploadQueuePositions,
  fetchUploadQueueSources,
  retryUploadQueueItem,
  runUploadQueueBulkAction,
} from "./applicant-import-upload-queue-api";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe("applicant import upload queue API helpers", () => {
  it("fetches position and source options defensively", async () => {
    const positionFetcher = vi.fn().mockResolvedValue(jsonResponse({
      data: [{ id: "position-1", title: "Engineer" }],
    }));
    const sourceFetcher = vi.fn().mockResolvedValue(jsonResponse([
      { id: "source-1", name: "LinkedIn" },
    ]));

    await expect(fetchUploadQueuePositions(positionFetcher)).resolves.toEqual([
      { id: "position-1", title: "Engineer" },
    ]);
    await expect(fetchUploadQueueSources(sourceFetcher)).resolves.toEqual([
      { id: "source-1", name: "LinkedIn" },
    ]);

    expect(positionFetcher).toHaveBeenCalledWith("/api/positions?limit=1000");
    expect(sourceFetcher).toHaveBeenCalledWith("/api/applicant-sources");
    await expect(fetchUploadQueuePositions(vi.fn().mockResolvedValue(jsonResponse({}, false)))).resolves.toEqual([]);
    await expect(fetchUploadQueueSources(vi.fn().mockResolvedValue(jsonResponse({}, true)))).resolves.toEqual([]);
  });

  it("fetches upload queue data and surfaces API errors", async () => {
    const params = new URLSearchParams({ limit: "10" });
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ data: [], total: 0 }));

    await expect(fetchUploadQueueData(params, fetcher)).resolves.toEqual({ data: [], total: 0 });
    expect(fetcher).toHaveBeenCalledWith("/api/upload-queue?limit=10", { cache: "no-store" });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(fetchUploadQueueData(
      params,
      vi.fn().mockResolvedValue(jsonResponse("bad request", false, 400))
    )).rejects.toThrow("HTTP error! status: 400 - bad request");
    consoleError.mockRestore();
  });

  it("runs item retry and delete requests", async () => {
    const retryFetcher = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const deleteFetcher = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

    await expect(retryUploadQueueItem("queue-1", retryFetcher)).resolves.toEqual({
      ok: true,
      data: { ok: true },
    });
    expect(retryFetcher).toHaveBeenCalledWith("/api/upload-queue/queue-1", expect.objectContaining({
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }));

    await expect(deleteUploadQueueItem("queue-1", deleteFetcher)).resolves.toEqual({
      ok: true,
      data: null,
    });
    expect(deleteFetcher).toHaveBeenCalledWith("/api/upload-queue/queue-1", {
      method: "DELETE",
      cache: "no-store",
    });
  });

  it("runs upload queue bulk actions", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ successCount: 2 }));

    await expect(runUploadQueueBulkAction("retry", ["1", "2"], fetcher)).resolves.toEqual({
      ok: true,
      data: { successCount: 2 },
    });
    expect(fetcher).toHaveBeenCalledWith("/api/upload-queue/bulk-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry", itemIds: ["1", "2"] }),
    });
  });
});
