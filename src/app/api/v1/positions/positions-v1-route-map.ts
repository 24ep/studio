import type { CreatePositionInput } from "./positions-v1-route-schema";

export type V1PositionRow = {
  id: string;
  title: string;
  department: string;
  description: string | null;
  matchCriteria: string | null;
  isOpen: boolean;
  positionLevel: string | null;
  gradeId: string | null;
  recruiterId: string | null;
  customAttributes: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  recruiterName: string | null;
  recruiterEmail: string | null;
};

export function mapV1PositionRow(row: V1PositionRow) {
  return {
    ...row,
    custom_attributes: row.customAttributes || {},
    recruiter: row.recruiterId
      ? {
        id: row.recruiterId,
        name: row.recruiterName,
        email: row.recruiterEmail,
      }
      : null,
  };
}

export function getCreatePositionValues(
  positionId: string,
  data: CreatePositionInput,
  defaultMatchCriteria: string | null,
) {
  return [
    positionId,
    data.title,
    data.department,
    data.description || null,
    data.matchCriteria && data.matchCriteria.trim() !== "" ? data.matchCriteria : defaultMatchCriteria,
    data.isOpen,
    data.positionLevel || null,
    data.custom_attributes || {},
  ];
}

export function mapCreatedPositionRow(row: { customAttributes?: Record<string, unknown> | null }) {
  return {
    ...row,
    custom_attributes: row.customAttributes || {},
  };
}
