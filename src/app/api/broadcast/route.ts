import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createBroadcastCampaign, listBroadcastCampaigns } from "@/lib/broadcast-campaigns";
import { broadcastAudienceSchema, requireBroadcastPermission } from "./broadcast-route-utils";

export const dynamic = "force-dynamic";

const queryChannel = z.enum(["sms", "email", "banner", "popup"]);
const announcementSchema = z.object({
  channel: z.enum(["banner", "popup"]),
  title: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(5000),
  audience: broadcastAudienceSchema,
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  placement: z.enum(["top", "dashboard", "ess"]).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  scrollAnimation: z.enum(["none", "slow", "medium", "fast"]).default("none"),
  ctaLabel: z.string().trim().max(80).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const forbidden = requireBroadcastPermission(session);
  if (forbidden) return forbidden;
  const rawChannel = request.nextUrl.searchParams.get("channel");
  const channel = rawChannel ? queryChannel.safeParse(rawChannel) : null;
  if (channel && !channel.success) return NextResponse.json({ message: "Invalid channel" }, { status: 400 });
  return NextResponse.json({ campaigns: await listBroadcastCampaigns(channel?.data) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const forbidden = requireBroadcastPermission(session);
  if (forbidden) return forbidden;
  const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid broadcast payload", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && expiresAt <= (scheduledAt || new Date())) return NextResponse.json({ message: "Expiry must be after publication time" }, { status: 400 });
  const status = scheduledAt && scheduledAt > new Date() ? "scheduled" : "active";
  const campaign = await createBroadcastCampaign({ ...parsed.data, scheduledAt, expiresAt, status, createdBy: session!.user.id, createdByName: session!.user.name || session!.user.email || "Unknown user" });
  return NextResponse.json({ message: status === "active" ? "Broadcast published" : "Broadcast scheduled", campaign }, { status: 201 });
}
