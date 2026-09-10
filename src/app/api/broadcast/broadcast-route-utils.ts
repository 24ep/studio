import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { z } from "zod";

import { getPool } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export const broadcastAudienceSchema = z.enum([
  "all-employees",
  "managers",
  "bangkok-office",
  "new-hires",
  "payroll-recipients",
  "custom",
]);

export interface BroadcastRecipient {
  email: string | null;
  name: string;
  phoneNumber: string | null;
}

export function requireBroadcastPermission(session: Session | null) {
  if (!session?.user || !hasPermission(session.user, "SYSTEM_SETTINGS_EDIT")) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  return null;
}

export async function getBroadcastRecipients(
  audience: z.infer<typeof broadcastAudienceSchema>,
  customRecipients: Array<{ email?: string; phoneNumber?: string; name?: string }> = [],
) {
  if (audience === "custom") {
    return customRecipients.map((recipient, index) => ({
      email: recipient.email || null,
      name: recipient.name || `Recipient ${index + 1}`,
      phoneNumber: recipient.phoneNumber || null,
    }));
  }

  const pool = getPool();
  const { whereClause, params } = getAudienceQuery(audience);
  const result = await pool.query<BroadcastRecipient>(
    `SELECT email, name, phone_number as "phoneNumber"
     FROM "User"
     WHERE is_active = true ${whereClause}
     ORDER BY name ASC
     LIMIT 1000`,
    params,
  );

  return result.rows;
}

function getAudienceQuery(audience: z.infer<typeof broadcastAudienceSchema>) {
  switch (audience) {
    case "managers":
      return { whereClause: "AND (role ILIKE $1 OR position_title ILIKE $1)", params: ["%manager%"] };
    case "bangkok-office":
      return { whereClause: "AND office_location ILIKE $1", params: ["%bangkok%"] };
    case "new-hires":
      return { whereClause: 'AND "createdAt" >= NOW() - INTERVAL \'30 days\'', params: [] };
    case "payroll-recipients":
      return { whereClause: "AND role NOT ILIKE $1", params: ["%viewer%"] };
    case "all-employees":
    default:
      return { whereClause: "", params: [] };
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function normalizePlainText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
