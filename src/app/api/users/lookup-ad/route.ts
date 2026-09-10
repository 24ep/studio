import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/auditLog";
import { getGraphClient, isGraphConfiguredAsync } from "@/lib/graphClient";
import { hasAnyPermission } from "@/lib/permissions";

import {
  getErrorMessage,
  lookupGraphUserByEmail,
  mapGraphUserToLookupResponse,
} from "./lookup-ad-graph";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function logLookupError(message: string, error: unknown) {
  console.error(message, getErrorMessage(error));
}

/**
 * Lookup user in Azure AD by email and fetch additional fields
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized: User session required." },
      { status: 401 },
    );
  }

  const hasUserViewPermission = hasAnyPermission(session.user, ["USERS_VIEW", "USERS_CREATE", "USERS_EDIT"]);

  if (!hasUserViewPermission) {
    await logAudit(
      "WARN",
      `Forbidden attempt to lookup AD user by ${session?.user?.email || "Unknown"} (ID: ${session?.user?.id || "N/A"}). Required: USERS_VIEW permission.`,
      "API:Users:LookupAD",
      session?.user?.id,
    );
    return NextResponse.json(
      { message: "Forbidden: You must have USERS_VIEW permission to lookup users in Azure AD." },
      { status: 403 },
    );
  }

  const isConfigured = await isGraphConfiguredAsync();
  if (!isConfigured) {
    return NextResponse.json(
      { message: "Azure AD is not configured. Please configure Azure AD credentials in environment variables." },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { message: "Email parameter is required." },
      { status: 400 },
    );
  }

  try {
    const graphClient = await getGraphClient();
    const adUser = await lookupGraphUserByEmail(graphClient, email, logLookupError);

    if (!adUser) {
      return NextResponse.json(
        { message: "User not found in Azure AD." },
        { status: 404 },
      );
    }

    return NextResponse.json(mapGraphUserToLookupResponse(adUser), { status: 200 });
  } catch (error) {
    console.error("[AD LOOKUP] Error:", error);
    const errorMessage = getErrorMessage(error);
    await logAudit(
      "ERROR",
      `Azure AD user lookup failed by ${session.user.email}. Error: ${errorMessage}`,
      "API:Users:LookupAD",
      session.user.id,
    );

    return NextResponse.json(
      {
        message: "Failed to lookup user in Azure AD",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

