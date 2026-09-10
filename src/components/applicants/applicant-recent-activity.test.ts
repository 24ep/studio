import { describe, expect, it } from "vitest";

import {
  buildRecentActivityEvents,
  formatActivityTimestamp,
} from "./ApplicantRecentActivity";

describe("applicant recent activity", () => {
  it("adds application received and keeps the latest three events", () => {
    const events = buildRecentActivityEvents(
      { id: "applicant-1", applicationDate: "2026-08-08T09:30:00.000Z" },
      [
        { id: "1", action: "Viewed", user: "Napat", time: "2026-08-08T10:00:00.000Z" },
        { id: "2", action: "Screening completed", user: "System", time: "2026-08-08T09:45:00.000Z" },
        { id: "3", action: "Profile updated", user: "Sarah", time: "2026-08-08T09:40:00.000Z" },
      ],
    );

    expect(events).toHaveLength(3);
    expect(events.map(event => event.title)).toEqual([
      "Viewed",
      "Screening completed",
      "Profile updated",
    ]);
  });

  it("does not duplicate an application received log", () => {
    const events = buildRecentActivityEvents(
      { id: "applicant-1", applicationDate: "2026-08-08T09:30:00.000Z" },
      [{ id: "1", action: "Application received", user: "System", time: "2026-08-08T09:30:00.000Z" }],
    );

    expect(events).toHaveLength(1);
  });

  it("formats invalid timestamps defensively", () => {
    expect(formatActivityTimestamp("not-a-date")).toBe("Date unavailable");
  });
});
