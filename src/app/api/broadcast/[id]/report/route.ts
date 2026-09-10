import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getBroadcastBannerReport } from "@/lib/broadcast-campaigns";
import { requireBroadcastPermission } from "../../broadcast-route-utils";

const campaignIdSchema = z.string().uuid();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const forbidden = requireBroadcastPermission(session);
  if (forbidden) return forbidden;

  const { id: rawId } = await params;
  const id = campaignIdSchema.safeParse(rawId);
  if (!id.success) return NextResponse.json({ message: "Invalid banner id" }, { status: 400 });

  const report = await getBroadcastBannerReport(id.data);
  if (!report) return NextResponse.json({ message: "Banner not found" }, { status: 404 });

  const format = new URL(request.url).searchParams.get("format");
  if (format === "csv") {
    const rows = [
      ["Employee", "Email", "Department", "Status", "Seen at", "Acknowledged at"],
      ...report.users.map(user => [
        user.name,
        user.email,
        user.department || "",
        user.acknowledgedAt ? "Acknowledged" : user.seenAt ? "Seen" : "Not seen",
        formatTimestamp(user.seenAt),
        formatTimestamp(user.acknowledgedAt),
      ]),
    ];
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="banner-${id.data.slice(0, 8)}-engagement.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}

function csvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toISOString() : "";
}
