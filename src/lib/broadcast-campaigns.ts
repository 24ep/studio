import { randomUUID } from "node:crypto";
import { getPool } from "@/lib/db";

export type BroadcastChannel = "sms" | "email" | "banner" | "popup";

export type BroadcastCampaign = {
  id: string;
  channel: BroadcastChannel;
  title: string;
  message: string;
  audience: string;
  status: "scheduled" | "sent" | "active" | "inactive" | "failed" | "expired";
  priority: string;
  placement: string | null;
  backgroundColor: string | null;
  fontColor: string | null;
  scrollAnimation: string;
  ctaLabel: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
  recipientCount: number;
  failedCount: number;
  owner: string;
  createdAt: string;
  seenCount?: number;
  acknowledgedCount?: number;
};

export type BroadcastBannerReportUser = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  seenAt: string | null;
  acknowledgedAt: string | null;
};

const SELECT_COLUMNS = `id, channel, title, message, audience, status, priority, placement,
  background_color AS "backgroundColor", font_color AS "fontColor", scroll_animation AS "scrollAnimation",
  cta_label AS "ctaLabel", scheduled_at AS "scheduledAt", expires_at AS "expiresAt",
  recipient_count AS "recipientCount", failed_count AS "failedCount",
  created_by_name AS owner, created_at AS "createdAt"`;

const ENGAGEMENT_COUNT_COLUMNS = `(SELECT COUNT(*)::int FROM broadcast_banner_engagements engagement
    WHERE engagement.campaign_id = broadcast_campaigns.id) AS "seenCount",
  (SELECT COUNT(*)::int FROM broadcast_banner_engagements engagement
    WHERE engagement.campaign_id = broadcast_campaigns.id AND engagement.acknowledged_at IS NOT NULL) AS "acknowledgedCount"`;

export async function listBroadcastCampaigns(channel?: BroadcastChannel) {
  const result = channel
    ? await getPool().query<BroadcastCampaign>(`SELECT ${SELECT_COLUMNS}, ${ENGAGEMENT_COUNT_COLUMNS} FROM broadcast_campaigns WHERE channel = $1 ORDER BY created_at DESC LIMIT 200`, [channel])
    : await getPool().query<BroadcastCampaign>(`SELECT ${SELECT_COLUMNS}, ${ENGAGEMENT_COUNT_COLUMNS} FROM broadcast_campaigns ORDER BY created_at DESC LIMIT 200`);
  return result.rows;
}

export async function listActiveAnnouncements(userId: string) {
  const result = await getPool().query<BroadcastCampaign>(
    `UPDATE broadcast_campaigns
     SET status = 'active', updated_at = now()
     WHERE channel IN ('banner', 'popup') AND status = 'scheduled' AND scheduled_at <= now()
     RETURNING id`,
  );
  void result;
  await getPool().query(
    `UPDATE broadcast_campaigns SET status = 'expired', updated_at = now()
     WHERE channel IN ('banner', 'popup') AND status = 'active' AND expires_at IS NOT NULL AND expires_at <= now()`,
  );
  const active = await getPool().query<BroadcastCampaign>(
    `SELECT ${SELECT_COLUMNS} FROM broadcast_campaigns
     WHERE channel IN ('banner', 'popup') AND status = 'active'
       AND (scheduled_at IS NULL OR scheduled_at <= now())
       AND (expires_at IS NULL OR expires_at > now())
       AND (channel <> 'banner' OR NOT EXISTS (
         SELECT 1 FROM broadcast_banner_engagements engagement
         WHERE engagement.campaign_id = broadcast_campaigns.id
           AND engagement.user_id = $1::uuid
           AND engagement.acknowledged_at IS NOT NULL
       ))
       AND (audience = 'all-employees' OR EXISTS (
         SELECT 1 FROM "User" u WHERE u.id = $1::uuid AND u.is_active = true AND (
           (audience = 'managers' AND (u.role ILIKE '%manager%' OR u.position_title ILIKE '%manager%')) OR
           (audience = 'bangkok-office' AND u.office_location ILIKE '%bangkok%') OR
           (audience = 'new-hires' AND u."createdAt" >= now() - interval '30 days') OR
           (audience = 'payroll-recipients' AND u.role NOT ILIKE '%viewer%')
         )
       ))
     ORDER BY priority = 'urgent' DESC, priority = 'important' DESC, created_at DESC`,
    [userId],
  );
  return active.rows;
}

export async function createBroadcastCampaign(input: {
  channel: BroadcastChannel; title: string; message: string; audience: string;
  status: BroadcastCampaign["status"]; priority?: string; placement?: string | null;
  backgroundColor?: string | null; fontColor?: string | null; scrollAnimation?: string;
  ctaLabel?: string | null; scheduledAt?: Date | null; expiresAt?: Date | null;
  recipientCount?: number; failedCount?: number; providerMessageId?: string | null;
  errorMessage?: string | null; createdBy?: string | null; createdByName: string;
}) {
  const result = await getPool().query<BroadcastCampaign>(
    `INSERT INTO broadcast_campaigns
      (id, channel, title, message, audience, status, priority, placement, background_color, font_color,
       scroll_animation, cta_label, scheduled_at, expires_at, recipient_count, failed_count,
       provider_message_id, error_message, created_by, created_by_name, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now())
     RETURNING ${SELECT_COLUMNS}`,
    [randomUUID(), input.channel, input.title, input.message, input.audience, input.status, input.priority || "normal",
      input.placement || null, input.backgroundColor || null, input.fontColor || null, input.scrollAnimation || "none",
      input.ctaLabel || null, input.scheduledAt || null, input.expiresAt || null, input.recipientCount || 0,
      input.failedCount || 0, input.providerMessageId || null, input.errorMessage || null, input.createdBy || null,
      input.createdByName],
  );
  return result.rows[0];
}

export async function deactivateBroadcastCampaign(id: string) {
  const result = await getPool().query<BroadcastCampaign>(
    `UPDATE broadcast_campaigns
     SET status = 'inactive', updated_at = now()
     WHERE id = $1::uuid AND channel = 'banner' AND status IN ('active', 'scheduled')
     RETURNING ${SELECT_COLUMNS}`,
    [id],
  );
  return result.rows[0] || null;
}

export async function recordBannerEngagement(input: {
  campaignId: string;
  userId: string;
  acknowledged: boolean;
}) {
  const result = await getPool().query<{ acknowledgedAt: string | null; seenAt: string }>(
    `INSERT INTO broadcast_banner_engagements
       (id, campaign_id, user_id, seen_at, acknowledged_at, created_at, updated_at)
     SELECT $1::uuid, campaign.id, $3::uuid, now(), CASE WHEN $4::boolean THEN now() ELSE NULL END, now(), now()
     FROM broadcast_campaigns campaign
     JOIN "User" users ON users.id = $3::uuid AND users.is_active = true
     WHERE campaign.id = $2::uuid AND campaign.channel = 'banner' AND campaign.status = 'active'
       AND (campaign.scheduled_at IS NULL OR campaign.scheduled_at <= now())
       AND (campaign.expires_at IS NULL OR campaign.expires_at > now())
       AND (
         campaign.audience = 'all-employees'
         OR (campaign.audience = 'managers' AND (users.role ILIKE '%manager%' OR users.position_title ILIKE '%manager%'))
         OR (campaign.audience = 'bangkok-office' AND users.office_location ILIKE '%bangkok%')
         OR (campaign.audience = 'new-hires' AND users."createdAt" >= now() - interval '30 days')
         OR (campaign.audience = 'payroll-recipients' AND users.role NOT ILIKE '%viewer%')
       )
     ON CONFLICT (campaign_id, user_id) DO UPDATE
       SET seen_at = LEAST(broadcast_banner_engagements.seen_at, EXCLUDED.seen_at),
           acknowledged_at = CASE
             WHEN $4::boolean THEN COALESCE(broadcast_banner_engagements.acknowledged_at, now())
             ELSE broadcast_banner_engagements.acknowledged_at
           END,
           updated_at = now()
     RETURNING seen_at AS "seenAt", acknowledged_at AS "acknowledgedAt"`,
    [randomUUID(), input.campaignId, input.userId, input.acknowledged],
  );
  return result.rows[0] || null;
}

export async function getBroadcastBannerReport(campaignId: string) {
  const pool = getPool();
  const campaignResult = await pool.query<{ id: string; title: string; audience: string }>(
    `SELECT id, title, audience FROM broadcast_campaigns WHERE id = $1::uuid AND channel = 'banner'`,
    [campaignId],
  );
  const campaign = campaignResult.rows[0];
  if (!campaign) return null;

  const usersResult = await pool.query<BroadcastBannerReportUser>(
    `SELECT users.id, users.name, users.email, users.department,
            engagement.seen_at AS "seenAt", engagement.acknowledged_at AS "acknowledgedAt"
     FROM "User" users
     LEFT JOIN broadcast_banner_engagements engagement
       ON engagement.user_id = users.id AND engagement.campaign_id = $1::uuid
     WHERE users.is_active = true AND (
       $2 = 'all-employees'
       OR ($2 = 'managers' AND (users.role ILIKE '%manager%' OR users.position_title ILIKE '%manager%'))
       OR ($2 = 'bangkok-office' AND users.office_location ILIKE '%bangkok%')
       OR ($2 = 'new-hires' AND users."createdAt" >= now() - interval '30 days')
       OR ($2 = 'payroll-recipients' AND users.role NOT ILIKE '%viewer%')
     )
     ORDER BY engagement.acknowledged_at DESC NULLS LAST, engagement.seen_at DESC NULLS LAST, users.name ASC`,
    [campaignId, campaign.audience],
  );
  const users = usersResult.rows;
  return {
    campaign,
    totalAudience: users.length,
    seenCount: users.filter(user => user.seenAt).length,
    acknowledgedCount: users.filter(user => user.acknowledgedAt).length,
    users,
  };
}
