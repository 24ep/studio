export type LearningRecordLike = Record<string, unknown>;

export function displayLearningValue(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10);
  }
  return String(value).replace(/_/g, " ");
}

export function learningNumberValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function learningBooleanValue(primary: unknown, secondary?: unknown) {
  const value = primary ?? secondary;
  return value === true || value === "true" || value === 1;
}

export function withoutEmptyLearningValues<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== ""),
  ) as Partial<T>;
}

export function learningRecordValue(
  record: LearningRecordLike,
  camel: string,
  snake?: string,
) {
  return record[camel] ?? (snake ? record[snake] : undefined);
}

export function learningStringArrayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function learningRecordsFromResponse<T>(payload: {
  resource?: { records?: T[] };
  records?: T[];
}) {
  return payload.resource?.records || payload.records || [];
}

export function normalizeLearningStatus(status: unknown) {
  return String(status || "active").toLowerCase();
}

export function isTrustedLearningCertificate(record: LearningRecordLike) {
  return learningRecordValue(record, "recordType", "record_type") === "trusted";
}

export function isActiveLearningCourse(course: LearningRecordLike) {
  const value = learningRecordValue(course, "isActive", "is_active");
  return value === undefined ? true : learningBooleanValue(value);
}

export function formatLearningDate(value: unknown) {
  if (!value) return "No date";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return displayLearningValue(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function learningDaysUntil(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function learningCourseColor(category: unknown) {
  const value = String(category || "").toLowerCase();
  if (value.includes("compliance") || value.includes("security")) {
    return "bg-emerald-600";
  }
  if (value.includes("lead") || value.includes("manager")) {
    return "bg-amber-600";
  }
  if (value.includes("customer") || value.includes("service")) {
    return "bg-rose-600";
  }
  if (value.includes("technical") || value.includes("data")) {
    return "bg-sky-600";
  }
  return "bg-indigo-600";
}
