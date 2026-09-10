import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { runHeadcountCreationEffects } from "@/app/api/headcount/headcount-route-utils";
import {
  assertPositionHeadcountCapacity,
  HeadcountAllocationError,
} from "@/lib/hr/organization-headcount-allocation";
import { hasPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { readRequestJsonResult } from "@/lib/request-json";
import {
  getHeadcountRequestActionStatus,
  getHeadcountRequestActionTransitionError,
  mergeHeadcountRequestActionFields,
} from "../headcount-request-utils";
import { parseHeadcountBulkActionInput } from "../headcount-bulk-utils";

export const dynamic = "force-dynamic";

class BatchValidationError extends Error {
  constructor(
    readonly status: number,
    readonly payload: Record<string, unknown>,
  ) {
    super(String(payload.message || "Invalid headcount batch."));
  }
}

function canManageHeadcountRequests(
  user: Parameters<typeof hasPermission>[0],
) {
  return (
    hasPermission(user, "POSITIONS_EDIT_BASIC") ||
    hasPermission(user, "POSITIONS_CREATE")
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!canManageHeadcountRequests(session.user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = parseHeadcountBulkActionInput(bodyResult.value);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const { ids, action, reason } = parsed.value;
  try {
    const rows = await prisma.$transaction(
      async (tx) => {
        const currentRows = await tx.headcount.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            status: true,
            positionId: true,
            customFields: true,
          },
        });
        const byId = new Map(currentRows.map((row) => [row.id, row]));
        const missingIds = ids.filter((id) => !byId.has(id));
        if (missingIds.length) {
          throw new BatchValidationError(404, {
            message: "One or more headcount requests no longer exist.",
            missingIds,
          });
        }

        const invalid = ids.flatMap((id) => {
          const row = byId.get(id)!;
          const message = getHeadcountRequestActionTransitionError(
            row.status,
            action,
          );
          return message ? [{ id, message }] : [];
        });
        if (invalid.length) {
          throw new BatchValidationError(409, {
            message:
              "The batch was not changed because one or more requests cannot make this transition.",
            invalid,
          });
        }

        for (const id of ids) {
          const row = byId.get(id)!;
          if (action === "approve") {
            await assertPositionHeadcountCapacity(
              tx,
              row.positionId,
              row.status === "rejected" ? 1 : 0,
            );
          }
          await tx.headcount.update({
            where: { id },
            data: {
              status: getHeadcountRequestActionStatus(action),
              customFields: mergeHeadcountRequestActionFields(
                row.customFields,
                { id, action, reason },
                session.user,
              ),
            },
          });
        }

        return currentRows;
      },
      { isolationLevel: "Serializable" },
    );

    if (action === "approve") {
      const positionIds = Array.from(new Set(rows.map((row) => row.positionId)));
      await Promise.all(
        positionIds.map((positionId) =>
          runHeadcountCreationEffects(positionId, session.user),
        ),
      );
    }

    return NextResponse.json({
      action,
      updatedIds: ids,
      count: ids.length,
    });
  } catch (error) {
    return batchWriteErrorResponse(error);
  }
}

function batchWriteErrorResponse(error: unknown) {
  if (error instanceof BatchValidationError) {
    return NextResponse.json(error.payload, { status: error.status });
  }
  if (error instanceof HeadcountAllocationError) {
    return NextResponse.json(
      {
        message: error.message,
        code: error.code,
        allocation: error.details,
      },
      { status: 409 },
    );
  }
  if (
    error instanceof Error &&
    (error.message.includes("organization assignment") ||
      error.message.includes("organization unit is inactive") ||
      error.message.includes("organization path contains an inactive"))
  ) {
    return NextResponse.json(
      { message: error.message, code: "POSITION_ORGANIZATION_INVALID" },
      { status: 400 },
    );
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  ) {
    return NextResponse.json(
      {
        message:
          "One or more headcount requests changed while the batch was being applied. Refresh and try again.",
        code: "HEADCOUNT_BATCH_CONFLICT",
      },
      { status: 409 },
    );
  }
  console.error("[HeadcountRequests] Bulk action failed:", error);
  return NextResponse.json(
    { message: "Unable to apply the headcount batch." },
    { status: 500 },
  );
}
