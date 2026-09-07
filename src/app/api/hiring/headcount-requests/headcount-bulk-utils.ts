export type HeadcountBulkAction = "approve" | "reject";

export type HeadcountBulkActionInput = {
  ids: string[];
  action: HeadcountBulkAction;
  reason?: string;
};

export type HeadcountBulkActionParseResult =
  | { ok: true; value: HeadcountBulkActionInput }
  | { ok: false; message: string };

export function parseHeadcountBulkActionInput(
  raw: unknown,
): HeadcountBulkActionParseResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Invalid bulk action body." };
  }

  const input = raw as Record<string, unknown>;
  const ids = Array.isArray(input.ids)
    ? Array.from(
        new Set(
          input.ids
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      )
    : [];

  if (!ids.length) {
    return { ok: false, message: "Select at least one headcount request." };
  }
  if (ids.length > 100) {
    return {
      ok: false,
      message: "Bulk actions are limited to 100 requests at a time.",
    };
  }

  const action = input.action;
  if (action !== "approve" && action !== "reject") {
    return { ok: false, message: "Bulk action must be approve or reject." };
  }

  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (action === "reject" && !reason) {
    return { ok: false, message: "Rejection reason is required." };
  }

  return {
    ok: true,
    value: {
      ids,
      action,
      ...(reason ? { reason } : {}),
    },
  };
}
