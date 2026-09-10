type Row = Record<string, unknown>;

const safe = (value: unknown) =>
  String(value ?? "")
    .replace(/[|\r\n]/g, " ")
    .trim();

export function buildPnd1V1(
  rows: Row[],
  config: {
    employerTaxId: string;
    employerLegacyTaxId?: string;
    employerBranchNumber: string;
  },
) {
  if (!/^\d{13}$/.test(config.employerTaxId))
    throw new Error("PND.1 requires a 13-digit employer tax ID.");
  return rows
    .map((row) => {
      const government = (row.government_identification || {}) as Row;
      const tax = (row.tax_information || {}) as Row;
      const personal = (row.personal_information || {}) as Row;
      const address = (row.address || {}) as Row;
      const nationalId = safe(
        government.nationalId || government.thaiNationalId || tax.taxId,
      )
        .replace(/\D/g, "")
        .padStart(13, "0")
        .slice(-13);
      const payDate = new Date(String(row.pay_date));
      if (Number.isNaN(payDate.getTime()))
        throw new Error("PND.1 requires a valid pay date.");
      const dd = String(payDate.getUTCDate()).padStart(2, "0");
      const mm = String(payDate.getUTCMonth() + 1).padStart(2, "0");
      const buddhistYear = String(payDate.getUTCFullYear() + 543);
      const address1 = safe(
        address.address1 || address.line1 || address.street,
      );
      const address2 = safe(
        address.address2 ||
          address.line2 ||
          [address.district, address.province].filter(Boolean).join(" "),
      );
      const postalCode = safe(address.postalCode || address.postcode)
        .replace(/\D/g, "")
        .slice(0, 5);
      return [
        "00",
        config.employerTaxId,
        config.employerLegacyTaxId || "0000000000",
        config.employerBranchNumber,
        nationalId,
        "0000000000",
        safe(personal.title),
        safe(row.first_name),
        safe(row.last_name),
        address1,
        address2,
        postalCode,
        mm,
        buddhistYear,
        "1",
        `${dd}${mm}${buddhistYear}`,
        "0",
        Number(row.gross_pay || 0).toFixed(2),
        Number(row.pit_withholding || 0).toFixed(2),
        "1",
      ].join("|");
    })
    .join("\r\n");
}

export function buildSso110DetailCsv(rows: Row[]) {
  const csvCell = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const headers = [
    "National ID",
    "First name",
    "Last name",
    "Actual wages",
    "Employee contribution",
    "Employer contribution",
  ];
  const records = rows.map((row) => {
    const government = (row.government_identification || {}) as Row;
    const tax = (row.tax_information || {}) as Row;
    const nationalId = safe(
      government.nationalId || government.thaiNationalId || tax.taxId,
    ).replace(/\D/g, "");
    return [
      nationalId,
      row.first_name,
      row.last_name,
      Number(row.gross_pay || 0).toFixed(2),
      Number(row.employee_social_security || 0).toFixed(2),
      Number(row.employer_social_security || 0).toFixed(2),
    ];
  });
  return [headers, ...records]
    .map((record) => record.map(csvCell).join(","))
    .join("\r\n");
}
