import type { HrCrudRecord } from "./hr-crud";

export interface EmployeeEditForm {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  employmentType: string;
  clientId: string;
  status: string;
  hireDate: string;
  location: string;
  preferredName: string;
  personalEmail: string;
  personalPhone: string;
  personalLocation: string;
  introduction: string;
  accountIsActive: boolean;
  departmentId: string;
  managerId: string;
  positionId: string;
  companyId: string;
  endDate: string;
  contractNoticeDays: string;
  probationPeriodDays: string;
  probationEvaluationFrequencyDays: string;
  legalName: string;
  businessUnit: string;
  workPhone: string;
  profilePhotoUrl: string;
  profileCompletion: string;
  jsonFields: Record<string, string>;
}

export function employeeRecordReference(employeeId: string) {
  if (employeeId.length <= 22) return employeeId;
  return `${employeeId.slice(0, 10)}…${employeeId.slice(-7)}`;
}

export function formatLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (value) => value.toUpperCase());
}

export function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString();
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).replace(/_/g, " ");
}

export function compactValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted === "Not set" ? "—" : formatted;
}

export function employmentTenure(hireDate: unknown, endDate?: unknown) {
  if (typeof hireDate !== "string" && !(hireDate instanceof Date)) return null;
  const start = new Date(
    hireDate instanceof Date ? hireDate.getTime() : hireDate,
  );
  const end =
    typeof endDate === "string" || endDate instanceof Date
      ? new Date(endDate instanceof Date ? endDate.getTime() : endDate)
      : new Date();
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return null;
  }

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth();
  if (end.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);

  if (months >= 12) {
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? "year" : "years"} of employment`;
  }
  return `${months} ${months === 1 ? "month" : "months"} of employment`;
}

export function jsonItems(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function objectEntries(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value as Record<string, unknown>)
    : [];
}

export function readableJsonValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not set";
  if (Array.isArray(value)) return value.map(readableJsonValue).join(", ");
  if (typeof value === "object") {
    return (
      Object.entries(value as Record<string, unknown>)
        .filter(
          ([, item]) => item !== null && item !== undefined && item !== "",
        )
        .map(([key, item]) => `${formatLabel(key)}: ${readableJsonValue(item)}`)
        .join(" · ") || "Not set"
    );
  }
  return formatValue(value);
}

export function normalizedHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function accountLinkStatus(employee: HrCrudRecord) {
  if (!employee.accountUserId) return "No matching account";
  return employee.accountLinkedByEmail
    ? "Matched by email"
    : "Linked by user ID";
}

export function accountAccessStatus(employee: HrCrudRecord) {
  if (!employee.accountUserId) return "Unlinked";
  if (employee.accountIsActive === false) return "Disabled";
  return employee.accountForcePasswordChange === true ? "Invited" : "Active";
}

export function employeeDisplayName(employee: HrCrudRecord | null) {
  if (!employee) return "Employee profile";
  return (
    [employee.firstName, employee.lastName]
      .filter(Boolean)
      .map(String)
      .join(" ") || "Unnamed employee"
  );
}

export function employeeEditForm(employee: HrCrudRecord): EmployeeEditForm {
  const personProfile =
    employee.personProfile && typeof employee.personProfile === "object"
      ? (employee.personProfile as Record<string, unknown>)
      : {};
  return {
    employeeNumber: String(employee.employeeNumber || ""),
    firstName: String(employee.firstName || ""),
    lastName: String(employee.lastName || ""),
    email: String(employee.email || ""),
    phone: String(employee.phone || ""),
    jobTitle: String(employee.jobTitle || ""),
    employmentType: String(employee.employmentType || "full_time"),
    clientId: String(employee.clientId || ""),
    status: String(employee.status || "active"),
    hireDate:
      typeof employee.hireDate === "string"
        ? employee.hireDate.slice(0, 10)
        : "",
    location: String(employee.location || ""),
    preferredName: String(
      personProfile.preferredName ||
        personProfile.preferred_name ||
        employee.preferredName ||
        "",
    ),
    personalEmail: String(personProfile.email || ""),
    personalPhone: String(personProfile.phone || ""),
    personalLocation: String(personProfile.location || ""),
    introduction: String(personProfile.introduction || ""),
    accountIsActive: employee.accountIsActive !== false,
    departmentId: String(employee.departmentId || ""),
    managerId: String(employee.managerId || ""),
    positionId: String(employee.positionId || ""),
    companyId: String(employee.companyId || ""),
    endDate:
      typeof employee.endDate === "string" ? employee.endDate.slice(0, 10) : "",
    contractNoticeDays: String(employee.contractNoticeDays ?? 30),
    probationPeriodDays:
      employee.probationPeriodDays == null
        ? ""
        : String(employee.probationPeriodDays),
    probationEvaluationFrequencyDays:
      employee.probationEvaluationFrequencyDays == null
        ? ""
        : String(employee.probationEvaluationFrequencyDays),
    legalName: String(employee.legalName || ""),
    businessUnit: String(employee.businessUnit || ""),
    workPhone: String(employee.workPhone || ""),
    profilePhotoUrl: String(employee.profilePhotoUrl || ""),
    profileCompletion: String(employee.profileCompletion ?? 0),
    jsonFields: Object.fromEntries(
      [
        "personalInformation",
        "address",
        "emergencyContacts",
        "familyDependents",
        "bankInformation",
        "taxInformation",
        "governmentIdentification",
        "education",
        "workExperience",
        "skills",
        "certifications",
        "languages",
      ].map((key) => [
        key,
        JSON.stringify(
          employee[key] ??
            ([
              "emergencyContacts",
              "familyDependents",
              "education",
              "workExperience",
              "skills",
              "certifications",
              "languages",
            ].includes(key)
              ? []
              : {}),
          null,
          2,
        ),
      ]),
    ),
  };
}
