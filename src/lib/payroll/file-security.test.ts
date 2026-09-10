import { afterEach, describe, expect, it, vi } from "vitest";
import { PayrollFileSecurityError, verifyPayrollFile } from "./file-security";

describe("payroll file security", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts content signatures instead of trusting the declared MIME type", async () => {
    const result = await verifyPayrollFile(
      Buffer.from("%PDF-1.7\n% payroll evidence\n"),
      new Set(["application/pdf"]),
      false,
    );
    expect(result.mime).toBe("application/pdf");
  });

  it("rejects disguised executable or unknown content", async () => {
    await expect(
      verifyPayrollFile(
        Buffer.from("MZ-not-a-pdf"),
        new Set(["application/pdf"]),
        false,
      ),
    ).rejects.toMatchObject({ status: 415 });
  });

  it("fails closed when mandatory malware scanning is not configured", async () => {
    vi.stubEnv("PAYROLL_FILE_SCAN_URL", "");
    await expect(
      verifyPayrollFile(
        Buffer.from("%PDF-1.7\n"),
        new Set(["application/pdf"]),
        true,
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
});
