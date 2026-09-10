import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { recordBannerEngagement } from "@/lib/broadcast-campaigns";

const campaignIdSchema = z.string().uuid();
const engagementSchema = z.object({ action: z.enum(["seen", "acknowledge"]) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = campaignIdSchema.safeParse(rawId);
  const body = engagementSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) {
    return NextResponse.json({ message: "Invalid banner engagement" }, { status: 400 });
  }

  const engagement = await recordBannerEngagement({
    campaignId: id.data,
    userId: session.user.id,
    acknowledged: body.data.action === "acknowledge",
  });
  if (!engagement) {
    return NextResponse.json({ message: "Active banner not found" }, { status: 404 });
  }

  return NextResponse.json({
    message: body.data.action === "acknowledge" ? "Banner acknowledged" : "Banner seen",
    engagement,
  });
}
