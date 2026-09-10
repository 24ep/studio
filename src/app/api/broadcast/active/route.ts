import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listActiveAnnouncements } from "@/lib/broadcast-campaigns";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ announcements: [] });

  try {
    return NextResponse.json({ announcements: await listActiveAnnouncements(session.user.id) });
  } catch (error) {
    // Announcements are optional layout content. A temporarily unavailable or
    // not-yet-migrated broadcast store must not fail every authenticated page.
    console.error("[Broadcast] Failed to load active announcements:", error);
    return NextResponse.json({ announcements: [] });
  }
}
