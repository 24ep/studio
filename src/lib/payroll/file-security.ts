import { fileTypeFromBuffer } from "file-type";

export class PayrollFileSecurityError extends Error {
  constructor(
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}

export async function verifyPayrollFile(
  buffer: Buffer,
  allowedMimeTypes: Set<string>,
  requireMalwareScan: boolean,
) {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !allowedMimeTypes.has(detected.mime))
    throw new PayrollFileSecurityError(
      "The file content does not match an allowed payroll document type.",
      415,
    );

  const scannerUrl = process.env.PAYROLL_FILE_SCAN_URL?.trim();
  if (requireMalwareScan && !scannerUrl)
    throw new PayrollFileSecurityError(
      "Payroll malware scanning is required but no scanner is configured.",
      503,
    );
  if (scannerUrl) {
    const response = await fetch(scannerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Detected-Content-Type": detected.mime,
      },
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    if (!response?.ok)
      throw new PayrollFileSecurityError(
        "Payroll file scanning is unavailable.",
        503,
      );
    const result = (await response.json().catch(() => null)) as {
      clean?: boolean;
    } | null;
    if (result?.clean !== true)
      throw new PayrollFileSecurityError(
        "The file did not pass malware scanning.",
        422,
      );
  }
  return detected;
}
