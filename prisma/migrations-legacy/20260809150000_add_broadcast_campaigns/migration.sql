CREATE TABLE IF NOT EXISTS "broadcast_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channel" VARCHAR(16) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "message" TEXT NOT NULL,
    "audience" VARCHAR(40) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "priority" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "placement" VARCHAR(24),
    "background_color" VARCHAR(7),
    "font_color" VARCHAR(7),
    "scroll_animation" VARCHAR(12) NOT NULL DEFAULT 'none',
    "cta_label" VARCHAR(80),
    "scheduled_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "provider_message_id" VARCHAR(255),
    "error_message" TEXT,
    "created_by" UUID,
    "created_by_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_campaigns_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "broadcast_campaigns"
    ADD COLUMN IF NOT EXISTS "background_color" VARCHAR(7),
    ADD COLUMN IF NOT EXISTS "font_color" VARCHAR(7),
    ADD COLUMN IF NOT EXISTS "scroll_animation" VARCHAR(12) NOT NULL DEFAULT 'none';

CREATE TABLE IF NOT EXISTS "broadcast_banner_engagements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_banner_engagements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "broadcast_campaigns_history_idx"
    ON "broadcast_campaigns"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "broadcast_campaigns_active_idx"
    ON "broadcast_campaigns"("channel", "status", "scheduled_at", "expires_at");

CREATE UNIQUE INDEX IF NOT EXISTS "broadcast_banner_engagement_campaign_user_key"
    ON "broadcast_banner_engagements"("campaign_id", "user_id");

CREATE INDEX IF NOT EXISTS "broadcast_banner_engagement_report_idx"
    ON "broadcast_banner_engagements"("campaign_id", "acknowledged_at");

CREATE INDEX IF NOT EXISTS "broadcast_banner_engagement_user_idx"
    ON "broadcast_banner_engagements"("user_id", "acknowledged_at");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broadcast_campaigns_created_by_fkey') THEN
        ALTER TABLE "broadcast_campaigns"
            ADD CONSTRAINT "broadcast_campaigns_created_by_fkey"
            FOREIGN KEY ("created_by") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broadcast_banner_engagements_campaign_id_fkey') THEN
        ALTER TABLE "broadcast_banner_engagements"
            ADD CONSTRAINT "broadcast_banner_engagements_campaign_id_fkey"
            FOREIGN KEY ("campaign_id") REFERENCES "broadcast_campaigns"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broadcast_banner_engagements_user_id_fkey') THEN
        ALTER TABLE "broadcast_banner_engagements"
            ADD CONSTRAINT "broadcast_banner_engagements_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
