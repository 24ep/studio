import { describe, expect, it } from "vitest";
import { buildPnd1V1, buildSso110DetailCsv } from "./statutory-export";

describe("Revenue Department PND.1 v1 export", () => {
  it("produces the official 20 pipe-delimited fields and Buddhist year", () => {
    const output = buildPnd1V1(
      [
        {
          first_name: "สมชาย",
          last_name: "ใจดี",
          pay_date: "2026-08-31",
          gross_pay: 50000,
          pit_withholding: 2500,
          government_identification: { nationalId: "1234567890123" },
          address: { postalCode: "10110" },
        },
      ],
      { employerTaxId: "0105555555555", employerBranchNumber: "0000" },
    );
    const fields = output.split("|");
    expect(fields).toHaveLength(20);
    expect(fields[13]).toBe("2569");
    expect(fields[15]).toBe("31082569");
    expect(fields[17]).toBe("50000.00");
  });
});

describe("SSO 1-10 detail export", () => {
  it("includes identity, actual wages, and both contribution amounts", () => {
    const output = buildSso110DetailCsv([
      {
        first_name: "Somchai",
        last_name: "Dee",
        gross_pay: 15000,
        employee_social_security: 750,
        employer_social_security: 750,
        government_identification: { nationalId: "1234567890123" },
      },
    ]);
    expect(output).toContain(
      '"1234567890123","Somchai","Dee","15000.00","750.00","750.00"',
    );
  });
});
