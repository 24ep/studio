import type { Grade } from "@/lib/types";

export interface GradeFormData {
  name: string;
  label: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  slaDays: number;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

export const defaultGradeData: GradeFormData = {
  name: "",
  label: "",
  description: "",
  minLevel: 1,
  maxLevel: 1,
  slaDays: 30,
  color: "#3B82F6",
  isActive: true,
  sortOrder: 0,
};

export function buildGradeFormData(grade: Grade): GradeFormData {
  return {
    name: grade.name,
    label: grade.label || "",
    description: grade.description || "",
    minLevel: grade.minLevel,
    maxLevel: grade.maxLevel,
    slaDays: grade.slaDays,
    color: grade.color || "#3B82F6",
    isActive: grade.isActive,
    sortOrder: grade.sortOrder,
  };
}
