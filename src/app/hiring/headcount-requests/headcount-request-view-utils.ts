export type HeadcountRequestStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "filled";

type HeadcountDecisionSource = {
  status: HeadcountRequestStatus;
  approvalAction: "approve" | "reject" | null;
};

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getDecisionAction(request: HeadcountDecisionSource) {
  if (request.approvalAction) return request.approvalAction;
  if (request.status === "approved") return "approve";
  if (request.status === "rejected") return "reject";
  return null;
}

export function getStatusBadgeClass(status: HeadcountRequestStatus) {
  switch (status) {
    case "draft":
      return "border-border bg-muted text-muted-foreground";
    case "in_review":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "filled":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300";
  }
}

export function getStatusLabel(status: HeadcountRequestStatus) {
  return {
    draft: "Draft",
    in_review: "In review",
    approved: "Approved",
    rejected: "Declined",
    filled: "Filled",
  }[status];
}
