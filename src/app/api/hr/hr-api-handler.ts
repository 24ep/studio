import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/auditLog";
import type { PlatformModuleId } from "@/lib/types";
import { hasAnyPermission } from "@/lib/permissions";
import { getHrModuleData } from "@/lib/hr/hr-api-data";
import { getHrModuleConfig, type HrModuleKey } from "@/lib/hr/hr-module-config";
import { getEmployeeForUser } from "@/lib/hr/ess-service";
import {
  createHrCrudRecord,
  deleteHrCrudRecord,
  getHrCrudRecord,
  listHrCrudRecords,
  parseHrMutationPayload,
  updateHrCrudRecord,
} from "@/lib/hr/hr-crud";

function hasHrPermission(
  user: Parameters<typeof hasAnyPermission>[0],
  permissions: string[],
) {
  return hasAnyPermission(user, permissions as PlatformModuleId[]);
}

export async function handleHrModuleGet(
  request: NextRequest,
  key: HrModuleKey,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized: User session required." },
      { status: 401 },
    );
  }

  const config = getHrModuleConfig(key);
  const view = request.nextUrl.searchParams.get("view");
  const id = request.nextUrl.searchParams.get("id");
  const hasModulePermission = hasHrPermission(session.user, [
    config.permission,
    config.managePermission,
  ]);
  if (!hasModulePermission) {
    const ownEmployee =
      key === "people" && id
        ? await getEmployeeForUser(session.user.id, session.user.email)
        : null;
    if (!ownEmployee || ownEmployee.id !== id) {
      return NextResponse.json(
        { message: "Forbidden: Insufficient HR permissions." },
        { status: 403 },
      );
    }
  }

  if (id) {
    const detail = await getHrCrudRecord(key, id, view);
    if (!detail)
      return NextResponse.json(
        { message: "HR record not found" },
        { status: 404 },
      );
    return NextResponse.json({ data: detail });
  }

  const [summary, resource] = await Promise.all([
    getHrModuleData(key, view),
    listHrCrudRecords(key, view),
  ]);
  return NextResponse.json({ ...summary, resource });
}

export async function handleHrModulePost(
  request: NextRequest,
  key: HrModuleKey,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized: User session required." },
      { status: 401 },
    );
  }

  const view = request.nextUrl.searchParams.get("view");
  const config = getHrModuleConfig(key);
  if (!hasHrPermission(session.user, [config.managePermission])) {
    return NextResponse.json(
      { message: "Forbidden: Insufficient HR manage permission." },
      { status: 403 },
    );
  }

  const payload = await parseHrMutationPayload({
    request,
    moduleKey: key,
    view,
  });
  if (!payload.ok) {
    return NextResponse.json(
      { message: "Invalid input", errors: payload.errors },
      { status: 400 },
    );
  }

  try {
    const data = await createHrCrudRecord({
      moduleKey: key,
      values: payload.values,
      file: payload.file,
      actingUserId: session.user.id,
      view,
    });
    await logAudit(
      "AUDIT",
      `HR ${payload.config.title} created.`,
      `API:HR:${payload.config.key}:Create`,
      session.user.id,
      { id: data.id },
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[HR API] Create failed:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to create HR record",
      },
      { status: 500 },
    );
  }
}

export async function handleHrModulePatch(
  request: NextRequest,
  key: HrModuleKey,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized: User session required." },
      { status: 401 },
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  const view = request.nextUrl.searchParams.get("view");
  const config = getHrModuleConfig(key);
  if (!hasHrPermission(session.user, [config.managePermission])) {
    return NextResponse.json(
      { message: "Forbidden: Insufficient HR manage permission." },
      { status: 403 },
    );
  }

  const payload = await parseHrMutationPayload({
    request,
    moduleKey: key,
    partial: true,
    view,
  });
  if (!payload.ok) {
    return NextResponse.json(
      { message: "Invalid input", errors: payload.errors },
      { status: 400 },
    );
  }

  try {
    const data = await updateHrCrudRecord({
      moduleKey: key,
      id,
      values: payload.values,
      file: payload.file,
      actingUserId: session.user.id,
      view,
    });
    if (!data)
      return NextResponse.json(
        { message: "HR record not found" },
        { status: 404 },
      );
    await logAudit(
      "AUDIT",
      `HR ${payload.config.title} updated.`,
      `API:HR:${payload.config.key}:Update`,
      session.user.id,
      { id },
    );
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[HR API] Update failed:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update HR record",
      },
      { status: 500 },
    );
  }
}

export async function handleHrModuleDelete(
  request: NextRequest,
  key: HrModuleKey,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized: User session required." },
      { status: 401 },
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  const view = request.nextUrl.searchParams.get("view");
  const permanent =
    key === "learning" &&
    view === "certifications" &&
    request.nextUrl.searchParams.get("permanent") === "true";
  const config = getHrModuleConfig(key);
  if (!hasHrPermission(session.user, [config.managePermission])) {
    return NextResponse.json(
      { message: "Forbidden: Insufficient HR manage permission." },
      { status: 403 },
    );
  }

  try {
    const data = await deleteHrCrudRecord(key, id, view, permanent);
    if (!data)
      return NextResponse.json(
        { message: "HR record not found" },
        { status: 404 },
      );
    await logAudit(
      "AUDIT",
      permanent
        ? "HR record permanently deleted."
        : "HR record archived/deleted.",
      `API:HR:${key}:Delete`,
      session.user.id,
      { id, permanent },
    );
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[HR API] Delete failed:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to delete HR record",
      },
      { status: 500 },
    );
  }
}
