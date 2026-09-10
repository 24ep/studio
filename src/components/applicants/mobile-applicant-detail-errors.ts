export function getMobileApplicantDetailErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function isMobileApplicantDetailAbortError(error: unknown) {
  return (error instanceof DOMException && error.name === "AbortError") ||
    (error !== null && typeof error === "object" && "name" in error && error.name === "AbortError");
}
