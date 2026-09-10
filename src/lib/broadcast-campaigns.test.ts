import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPool } from "@/lib/db";
import { getBroadcastBannerReport, listActiveAnnouncements, recordBannerEngagement } from "./broadcast-campaigns";

vi.mock("@/lib/db", () => ({ getPool: vi.fn() }));

const query = vi.fn();

describe("broadcast banner engagement", () => {
  beforeEach(() => {
    query.mockReset();
    vi.mocked(getPool).mockReturnValue({ query } as never);
  });

  it("excludes banners already acknowledged by the current user", async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

    await listActiveAnnouncements("d4fc4b80-3635-4ef5-a839-98889641ec04");

    expect(query.mock.calls[2][0]).toContain("engagement.acknowledged_at IS NOT NULL");
    expect(query.mock.calls[2][1]).toEqual(["d4fc4b80-3635-4ef5-a839-98889641ec04"]);
  });

  it("records eligible employee acknowledgement with an idempotent upsert", async () => {
    query.mockResolvedValueOnce({ rows: [{ seenAt: "2026-08-01T10:00:00.000Z", acknowledgedAt: "2026-08-01T10:01:00.000Z" }] });

    await recordBannerEngagement({
      campaignId: "d4fc4b80-3635-4ef5-a839-98889641ec04",
      userId: "74a52b91-3bca-4c51-8a50-20e20f0af54d",
      acknowledged: true,
    });

    expect(query.mock.calls[0][0]).toContain("ON CONFLICT (campaign_id, user_id) DO UPDATE");
    expect(query.mock.calls[0][0]).toContain("campaign.audience = 'managers'");
    expect(query.mock.calls[0][1].slice(1)).toEqual([
      "d4fc4b80-3635-4ef5-a839-98889641ec04",
      "74a52b91-3bca-4c51-8a50-20e20f0af54d",
      true,
    ]);
  });

  it("reports the full audience and separates seen from acknowledged", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: "campaign-1", title: "Policy update", audience: "all-employees" }] })
      .mockResolvedValueOnce({ rows: [
        { id: "user-1", name: "Seen", email: "seen@example.com", department: "HR", seenAt: "2026-08-01T10:00:00.000Z", acknowledgedAt: null },
        { id: "user-2", name: "Acknowledged", email: "ack@example.com", department: "Finance", seenAt: "2026-08-01T10:00:00.000Z", acknowledgedAt: "2026-08-01T10:01:00.000Z" },
        { id: "user-3", name: "Pending", email: "pending@example.com", department: null, seenAt: null, acknowledgedAt: null },
      ] });

    const report = await getBroadcastBannerReport("d4fc4b80-3635-4ef5-a839-98889641ec04");

    expect(report).toMatchObject({ totalAudience: 3, seenCount: 2, acknowledgedCount: 1 });
  });
});
