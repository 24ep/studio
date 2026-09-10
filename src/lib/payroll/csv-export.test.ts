import { describe, expect, it } from "vitest";

import { buildPayrollCsv, payrollCsvCell } from "./csv-export";

describe("payroll CSV export", () => {
  it("quotes values and doubles embedded quotes", () => {
    expect(payrollCsvCell('Payroll "A"')).toBe('"Payroll ""A"""');
  });

  it.each(["=2+2", "+SUM(A1:A2)", "-10+20", "@cmd"])(
    "neutralises spreadsheet formula prefixes in text: %s",
    (value) => {
      expect(payrollCsvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("preserves legitimate negative numeric adjustments", () => {
    expect(payrollCsvCell(-1250.5)).toBe('"-1250.5"');
  });

  it("uses CRLF rows and keeps null values empty", () => {
    expect(
      buildPayrollCsv(
        ["Employee", "Amount"],
        [
          ["EMP-001", 1200],
          [null, undefined],
        ],
      ),
    ).toBe('"Employee","Amount"\r\n"EMP-001","1200"\r\n"",""');
  });
});
