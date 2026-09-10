export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/['"]/g, "")
    .replace(/[;]/g, "")
    .replace(/[--]/g, "")
    .replace(/[\/\*]/g, "")
    .substring(0, 1000);
}

export function sanitizeFileName(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .substring(0, 255);
}

export function sanitizeSearchQuery(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>'";]/g, "")
    .replace(/\s+/g, " ")
    .substring(0, 500);
}

export function validateSearchParams(
  searchParams: URLSearchParams,
  allowedParams: string[],
): Record<string, string> {
  const validated: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (allowedParams.includes(key) && typeof value === "string") {
      validated[key] = sanitizeString(value);
    }
  }

  return validated;
}
