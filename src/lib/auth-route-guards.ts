import { auth } from "@/auth";
import { logAudit } from "@/lib/auditLog";
import { getPool } from "@/lib/db";
import { validateUserExists } from "@/lib/auth-user-validation";
import { NextResponse, type NextRequest } from "next/server";

async function getDisabledUserError(userId: string) {
  const client = await getPool().connect();
  try {
    const result = await client.query('SELECT "is_active" FROM "User" WHERE id = $1', [userId]);
    if (result.rows.length > 0 && !result.rows[0].is_active) {
      return "Your account has been disabled. Please contact your administrator.";
    }
  } catch (error) {
    console.error("[REQUIRE SESSION] Error checking user status:", error);
  } finally {
    client.release();
  }

  return null;
}

export async function requireSessionAndPermission(requiredPermission: string, _request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const userExists = await validateUserExists(session.user.id);
  if (!userExists) {
    const disabledUserError = await getDisabledUserError(session.user.id);
    if (disabledUserError) {
      await logAudit(
        "WARN",
        `Disabled user attempted to access resource: ${session.user.name || session.user.email}.`,
        `API:${requiredPermission}`,
        session.user.id,
      );
      return { error: NextResponse.json({ message: disabledUserError }, { status: 403 }) };
    }

    return { error: NextResponse.json({ message: "Invalid user session. Please sign in again." }, { status: 401 }) };
  }

  if (session.user.role === "Admin") {
    return { session };
  }

  if (!session.user.modulePermissions?.includes(requiredPermission)) {
    await logAudit(
      "WARN",
      `Forbidden attempt to access resource by ${session.user.name || session.user.email}.`,
      `API:${requiredPermission}`,
      session.user.id,
    );
    return {
      error: NextResponse.json({
        message: `Forbidden: Insufficient permissions to ${requiredPermission.toLowerCase().replace("_", " ")}`,
      }, { status: 403 }),
    };
  }

  return { session };
}
