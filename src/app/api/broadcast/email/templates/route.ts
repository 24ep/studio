import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getSystemSetting } from "@/lib/systemSettings";
import { requireBroadcastPermission } from "../../broadcast-route-utils";
import { parseTemplateCatalog } from "./template-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const forbidden = requireBroadcastPermission(session);
  if (forbidden) return forbidden;

  const templates = parseTemplateCatalog(await getSystemSetting("emailTemplateCatalog"));
  return NextResponse.json({ templates });
}
