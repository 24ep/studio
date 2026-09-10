import { describe, expect, it } from "vitest";

import {
  normalizePositionOptions,
  normalizeQueueResponse,
  normalizeSourceOptions,
  normalizeUploadQueueActionData,
} from "./applicant-import-upload-queue-normalizers";

describe("applicant import upload queue normalizers", () => {
  it("normalizes position and source options defensively", () => {
    expect(normalizePositionOptions({
      data: [
        { id: "position-1", title: "Engineer" },
        { id: "missing-title" },
        null,
      ],
    })).toEqual([{ id: "position-1", title: "Engineer" }]);

    expect(normalizeSourceOptions([
      { id: "source-1", name: "LinkedIn", logo: "/logo.png" },
      { id: "missing-name" },
      "bad",
    ])).toEqual([{ id: "source-1", name: "LinkedIn", logo: "/logo.png" }]);
  });

  it("normalizes queue responses and drops invalid rows", () => {
    expect(normalizeQueueResponse({
      data: [
        {
          id: "queue-1",
          file_name: "cv.pdf",
          file_size: 123,
          status: "success",
          upload_date: "2026-01-01",
          updated_at: "2026-01-02",
          file_path: "/cv.pdf",
          progress: 100,
          webhook_payload: { ok: true },
          applicant_id: "applicant-1",
          applicant_name: "Ada Candidate",
        },
        { file_name: "missing-id.pdf" },
      ],
      total: 2,
      summary: {
        queued: 1,
        inprocess: 2,
        success: 3,
        error: 4,
        total: 10,
      },
    })).toEqual({
      data: [expect.objectContaining({
        id: "queue-1",
        file_name: "cv.pdf",
        file_size: 123,
        status: "success",
        progress: 100,
        webhook_payload: { ok: true },
        applicant_id: "applicant-1",
        applicant_name: "Ada Candidate",
      })],
      total: 2,
      summary: {
        queued: 1,
        inprocess: 2,
        success: 3,
        error: 4,
        total: 10,
      },
    });
  });

  it("normalizes action data from success and error responses", () => {
    expect(normalizeUploadQueueActionData({
      ok: false,
      message: "Failed",
      successCount: 2,
      failedDetails: [{ reason: "Bad file" }, "unknown"],
    })).toEqual({
      ok: false,
      error: "Failed",
      successCount: 2,
      failedDetails: [{ reason: "Bad file" }, {}],
    });

    expect(normalizeUploadQueueActionData(null)).toEqual({});
  });
});
