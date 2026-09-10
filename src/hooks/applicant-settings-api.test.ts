import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_APPLICANT_SETTINGS_FOR_HOOK,
  getApplicantSettingsErrorMessage,
  getApplicantSettingsRetryDelay,
  isApplicantSettingsAbortError,
  loadApplicantSettingsFromApi,
  mergeApplicantSettingsResponse,
  saveApplicantSettingsToApi,
} from "./applicant-settings-api";

function response(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), init);
}

describe("applicant-settings-api", () => {
  it("merges API applicant settings with hook defaults", () => {
    expect(DEFAULT_APPLICANT_SETTINGS_FOR_HOOK.showPinSection).toBe(true);
    expect(mergeApplicantSettingsResponse({
      applicants: {
        pageSize: 50,
        showPinSection: false,
      },
    })).toMatchObject({
      pageSize: 50,
      showPinSection: false,
      sortColumn: "applicationDate",
    });
  });

  it("normalizes retry delays and errors", () => {
    expect(getApplicantSettingsRetryDelay(0)).toBe(1000);
    expect(getApplicantSettingsRetryDelay(3)).toBe(3000);
    expect(getApplicantSettingsErrorMessage(new Error("bad"), "fallback")).toBe("bad");
    expect(getApplicantSettingsErrorMessage("bad", "fallback")).toBe("fallback");

    const abortError = new DOMException("aborted", "AbortError");
    expect(isApplicantSettingsAbortError(abortError)).toBe(true);
  });

  it("loads applicant settings and handles auth failures", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({ applicants: { pageSize: 40 } }, { status: 200 }))
      .mockResolvedValueOnce(response({ message: "nope" }, { status: 401 }));

    await expect(loadApplicantSettingsFromApi(fetcher)).resolves.toMatchObject({
      ok: true,
      settings: {
        pageSize: 40,
      },
    });
    await expect(loadApplicantSettingsFromApi(fetcher)).resolves.toEqual({
      ok: false,
      error: "Authentication required. Please refresh the page.",
    });
  });

  it("saves applicant settings and reports server failures", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({ ok: true }, { status: 200 }))
      .mockResolvedValueOnce(new Response("No permission", { status: 403, statusText: "Forbidden" }));

    await expect(saveApplicantSettingsToApi(DEFAULT_APPLICANT_SETTINGS_FOR_HOOK, fetcher)).resolves.toBeUndefined();
    await expect(saveApplicantSettingsToApi(DEFAULT_APPLICANT_SETTINGS_FOR_HOOK, fetcher)).rejects.toThrow(
      "Failed to save settings: 403 Forbidden - No permission",
    );
  });
});
