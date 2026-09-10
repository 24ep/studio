import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { deactivateBroadcastCampaign } from "@/lib/broadcast-campaigns";
import { requireBroadcastPermission } from "../broadcast-route-utils";

const campaignIdSchema = z.string().uuid();
const updateSchema = z.object({ action: z.literal("deactivate") });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const forbidden = requireBroadcastPermission(session);
  if (forbidden) return forbidden;

  const { id: rawId } = await params;
  const id = campaignIdSchema.safeParse(rawId);
  const body = updateSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) {
    return NextResponse.json({ message: "Invalid banner update" }, { status: 400 });
  }

  const campaign = await deactivateBroadcastCampaign(id.data);
  if (!campaign) {
    return NextResponse.json({ message: "Active or scheduled banner not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Banner deactivated", campaign });
}
