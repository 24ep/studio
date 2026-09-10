import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import type { SurveyAccessContext } from "./survey-service";

export async function requireSurveySession(): Promise<
  { session: Session; context: SurveyAccessContext; error?: never }
  | { session?: never; context?: never; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return {
    session,
    context: {
      userId: session.user.id,
      isAdmin: session.user.role === "Admin",
      permissions: session.user.modulePermissions || [],
    },
  };
}

export function requireSurveyPermission(
  session: Session,
  permission: string,
) {
  if (session.user.role === "Admin" || hasPermission(session.user, permission)) return null;
  return NextResponse.json(
    { message: "Forbidden: insufficient Survey permission", permission },
    { status: 403 },
  );
}

export function surveyApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Survey request failed.";
  const details = error && typeof error === "object" && "issues" in error
    ? { issues: (error as { issues: unknown }).issues }
    : {};
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code: unknown }).code)
    : null;
  if (code === "CONCURRENT_UPDATE") {
    return NextResponse.json({ message, code }, { status: 409 });
  }
  const status = /not found|not available|do not have access/i.test(message)
    ? 404
    : /permission|forbidden/i.test(message)
      ? 403
      : /already|closed|paused|invalid|unknown|required|complete|fix|cannot|changed|audience/i.test(message)
        ? 400
        : 500;
  if (status === 500) console.error("[SURVEY API]", error);
  return NextResponse.json({ message, ...details }, { status });
}

