export function payrollExportFilename(
  contentDisposition: string | null,
  fallbackFilename: string,
) {
  const filename = contentDisposition
    ?.match(/filename="?([^";]+)"?/i)?.[1]
    ?.trim();
  return filename || fallbackFilename;
}

function payrollExportErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const error = (payload as Record<string, unknown>).error;
  if (!error || typeof error !== "object") return fallback;
  const message = (error as Record<string, unknown>).message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export async function downloadControlledPayrollExport(
  url: string,
  fallbackFilename: string,
) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payrollExportErrorMessage(payload, "Payroll register export failed."),
    );
  }

  const filename = payrollExportFilename(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  try {
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return filename;
}
