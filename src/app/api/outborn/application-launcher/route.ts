import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  AccountDirectoryError,
  createAccountDirectoryClient,
} from "@outborn/account-directory";

export const dynamic = "force-dynamic";

function getAccountBaseUrl(): string | null {
  const configured = (
    process.env.OUTBORN_ACCOUNT_AUTH_URL ||
    process.env.OUTBORN_ACCOUNT_BASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  return configured || null;
}

function isActiveAccessStatus(value: string): boolean {
  return value.trim().toLowerCase() === "active";
}

export async function GET(request: NextRequest) {
  const baseUrl = getAccountBaseUrl();
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  if (!baseUrl || !secret) {
    return NextResponse.json(
      { error: "Outborn Account is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const token = await getToken({
      req: request,
      secret,
      cookieName: "next-auth.session-token",
      salt: "next-auth.session-token",
    });
    const accessToken = token?.outbornAccountAccessToken;

    if (typeof accessToken !== "string" || !accessToken.trim()) {
      return NextResponse.json(
        { error: "Outborn Account session required." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const directory = createAccountDirectoryClient({
      baseUrl,
      getAccessToken: () => accessToken,
      credentials: "omit",
    });

    const context = await directory.getCurrentContext();
    const organization =
      context.currentOrganization ?? context.organizations[0] ?? null;

    if (!organization) {
      return NextResponse.json(
        { organization: null, accountHref: baseUrl, applications: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const applications = await directory.listOrganizationApplications(
      organization.id,
    );

    return NextResponse.json(
      {
        organization: {
          id: organization.id,
          name: organization.name,
        },
        accountHref: baseUrl,
        applications: applications.map((application) => ({
          applicationId: application.applicationId,
          name: application.name,
          description: application.description,
          iconUrl: application.iconUrl,
          launchUrl: application.launchUrl,
          accessible: isActiveAccessStatus(application.accessStatus),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status =
      error instanceof AccountDirectoryError && error.status === 401 ? 401 : 502;

    console.error(
      "[OUTBORN APPLICATION LAUNCHER] Failed to load Account directory:",
      error,
    );

    return NextResponse.json(
      {
        error:
          status === 401
            ? "Outborn Account session required."
            : "Unable to load Outborn applications.",
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
