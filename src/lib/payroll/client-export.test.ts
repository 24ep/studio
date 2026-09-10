import { describe, expect, it } from "vitest";

import { payrollExportFilename } from "./client-export";

describe("payrollExportFilename", () => {
  it("uses the server-provided attachment filename", () => {
    expect(
      payrollExportFilename(
        'attachment; filename="payroll-register-2026-08.csv"',
        "payroll-register.csv",
      ),
    ).toBe("payroll-register-2026-08.csv");
  });

  it("accepts an unquoted filename", () => {
    expect(
      payrollExportFilename(
        "attachment; filename=payroll-register.csv",
        "fallback.csv",
      ),
    ).toBe("payroll-register.csv");
  });

  it("falls back when Content-Disposition does not contain a filename", () => {
    expect(payrollExportFilename("inline", "payroll-register.csv")).toBe(
      "payroll-register.csv",
    );
  });

  it("falls back when Content-Disposition is missing", () => {
    expect(payrollExportFilename(null, "payroll-register.csv")).toBe(
      "payroll-register.csv",
    );
  });
});
