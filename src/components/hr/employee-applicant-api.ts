import { readJsonOrFallback } from "@/lib/response-json";

export interface EligibleEmployeeApplicant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  positionTitle: string | null;
  statusName: string;
}

interface EligibleEmployeeApplicantsResponse {
  applicants?: EligibleEmployeeApplicant[];
  message?: string;
}

interface CreateEmployeeResponse {
  created?: boolean;
  message?: string;
  employee?: {
    id: string;
    employeeNumber: string;
  };
  account?: {
    loginEmail: string;
    role: "Employee";
    accountCreated: boolean;
    setupEmail?: { sent: boolean; error?: string };
  };
}

interface DirectEmployeeResponse {
  data?: {
    id: string;
    employeeNumber: string;
  };
  message?: string;
}

export async function fetchEligibleEmployeeApplicants(signal?: AbortSignal) {
  const response = await fetch("/api/hr/employees/eligible-applicants", {
    credentials: "include",
    signal,
  });
  const payload = await readJsonOrFallback<EligibleEmployeeApplicantsResponse>(
    response,
    {},
  );

  if (!response.ok) {
    throw new Error(payload.message || "Unable to load eligible applicants.");
  }

  return Array.isArray(payload.applicants) ? payload.applicants : [];
}

export async function createEmployeeFromSelectedApplicant(
  applicantId: string,
  employeeAttributes?: Record<string, unknown>,
) {
  const response = await fetch(`/api/applicants/${applicantId}/create-employee`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await readJsonOrFallback<CreateEmployeeResponse>(response, {});

  if (!response.ok) {
    throw new Error(payload.message || "Unable to create employee.");
  }

  if (payload.employee?.id && employeeAttributes) {
    const updateResponse = await fetch(
      `/api/hr/employees?id=${encodeURIComponent(payload.employee.id)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeAttributes),
      },
    );
    const updatePayload = await readJsonOrFallback<{ message?: string }>(
      updateResponse,
      {},
    );
    if (!updateResponse.ok) {
      throw new Error(
        updatePayload.message ||
          "Employee was created, but the additional employee details could not be saved.",
      );
    }
  }

  return payload;
}

export async function createEmployeeDirect(
  employeeAttributes: Record<string, unknown>,
): Promise<CreateEmployeeResponse> {
  const response = await fetch("/api/hr/employees", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employeeAttributes),
  });
  const payload = await readJsonOrFallback<DirectEmployeeResponse>(response, {});

  if (!response.ok) {
    throw new Error(payload.message || "Unable to create employee.");
  }

  return {
    created: true,
    message: payload.message,
    employee: payload.data,
  };
}
