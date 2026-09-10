import type { Applicant } from "@/lib/types";

import {
  getApplicantParsedRecordField,
  parseApplicantParsedDataRecord,
} from "./applicant-parsed-data-utils";
import type {
  ApplicantEditFormValues,
  ApplicantEditParsedDataFormValue,
  ApplicantStageLike,
} from "./full-applicant-detail-types";
import { resolveApplicantStageId } from "./full-applicant-detail-stage-utils";

export function normalizeApplicantJustification(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeApplicantFitScore(value: unknown) {
  if (typeof value !== "number") {
    return value as null | undefined;
  }

  const decimalValue = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, decimalValue));
}

export function getDefaultApplicantEditFormValues(): ApplicantEditFormValues {
  return {
    email: "",
    phone: "",
    positionId: null,
    recruiterId: null,
    sourceId: null,
    fitScore: null,
    status: "",
    expectedSalary: null,
    assignmentJustification: [],
    parsedData: {
      personal_info: {
        title_honorific: "",
        firstname: "",
        lastname: "",
        nickname: "",
        location: "",
        introduction_aboutme: "",
      },
      contact_info: {
        email: "",
        phone: "",
      },
      education: [],
      experience: [],
      skills: [],
      job_suitable: [],
      job_matches: [],
    },
  };
}

export function normalizeApplicantEditParsedData(parsedData: unknown): ApplicantEditParsedDataFormValue {
  const parsedDataObj = parseApplicantParsedDataRecord(parsedData);
  return {
    personal_info: asRecord(parsedDataObj.personal_info),
    contact_info: asRecord(parsedDataObj.contact_info),
    education: asArray(parsedDataObj.education),
    experience: asArray(parsedDataObj.experience),
    skills: asArray(parsedDataObj.skills),
    job_suitable: asArray(parsedDataObj.job_suitable),
    job_matches: asArray(parsedDataObj.job_matches),
  };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function buildApplicantEditFormValues(applicant: Applicant): ApplicantEditFormValues {
  return {
    email: applicant.email || "",
    phone: applicant.phone || "",
    positionId: applicant.positionId || null,
    recruiterId: applicant.recruiterId || null,
    sourceId: applicant.sourceId || null,
    fitScore: normalizeApplicantFitScore(applicant.fitScore),
    status: applicant.statusId || applicant.status || "",
    expectedSalary: applicant.expectedSalary || null,
    assignmentJustification: normalizeApplicantJustification(applicant.assignmentJustification),
    parsedData: normalizeApplicantEditParsedData(applicant.parsedData),
  };
}

export function composeApplicantName(parsedData: unknown, fallbackName: string) {
  const personalInfo = getApplicantParsedRecordField(parsedData, "personal_info");

  const fullName = [
    personalInfo.title_honorific,
    personalInfo.firstname,
    personalInfo.lastname,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .join(" ");

  return fullName || fallbackName;
}

type ApplicantDetailsUpdatePayloadInput = Partial<Omit<ApplicantEditFormValues, "parsedData">> & {
  parsedData?: unknown;
};

export function createApplicantDetailsUpdatePayload(
  data: ApplicantDetailsUpdatePayloadInput,
  applicant: Pick<Applicant, "name" | "statusId" | "customFields">,
  stages: ApplicantStageLike[],
) {
  return {
    ...data,
    name: composeApplicantName(data.parsedData, applicant.name),
    status: resolveApplicantStageId(data.status, applicant.statusId, stages),
    customFields: applicant.customFields || {},
  };
}
