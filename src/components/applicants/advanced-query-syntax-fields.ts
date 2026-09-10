import type {
  AdvancedQueryFieldDefinition,
  AdvancedQuerySpecialValue,
} from "./advanced-query-syntax-types";

export const ADVANCED_QUERY_FIELDS: AdvancedQueryFieldDefinition[] = [
  { field: "name", description: "Applicant name", example: "name:John" },
  { field: "email", description: "Email address", example: "email:john@example.com" },
  { field: "phone", description: "Phone number", example: "phone:+1234567890" },
  { field: "skills", description: "Skills (comma-separated)", example: "skills:React,Python" },
  { field: "location", description: "Location", example: "location:New York" },
  { field: "status", description: "Application status", example: "status:Applied,Screening" },
  { field: "positionId", description: "Position ID(s)", example: "positionId:pos1,pos2" },
  { field: "recruiterId", description: "Recruiter ID", example: "recruiterId:recruiter123" },
  { field: "selectedSourceIds", description: "Source ID(s)", example: "selectedSourceIds:source1,source2" },
  { field: "education", description: "Education/degree", example: "education:MBA" },
  { field: "minAppliedJobFitScore", description: "Minimum fit score (%)", example: "minAppliedJobFitScore:80" },
  { field: "maxAppliedJobFitScore", description: "Maximum fit score (%)", example: "maxAppliedJobFitScore:30" },
  { field: "minMatchingJobFitScore", description: "Min matching job fit (%)", example: "minMatchingJobFitScore:75" },
  { field: "maxMatchingJobFitScore", description: "Max matching job fit (%)", example: "maxMatchingJobFitScore:50" },
  { field: "minExperienceYears", description: "Minimum experience years", example: "minExperienceYears:5" },
  { field: "maxExperienceYears", description: "Maximum experience years", example: "maxExperienceYears:10" },
  { field: "applicationDateStart", description: "Application date from", example: "applicationDateStart:2024-01-01" },
  { field: "applicationDateEnd", description: "Application date to", example: "applicationDateEnd:2024-01-31" },
  { field: "locationOperator", description: "Location search type", example: "locationOperator:contains" },
];

export const ADVANCED_QUERY_STATUS_VALUES = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview Scheduled",
  "Interviewing",
  "Offer Extended",
  "Offer Accepted",
  "Hired",
  "Rejected",
  "On Hold",
];

export const ADVANCED_QUERY_SPECIAL_VALUES: AdvancedQuerySpecialValue[] = [
  { value: "unassigned", description: "Find records without assignment" },
  { value: "select-all", description: "Show all options (no filter)" },
  { value: "not-applied", description: "Find Applicants without positions" },
];
