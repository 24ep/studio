import type { AdvancedQueryExampleCategory } from "./advanced-query-syntax-types";

export const ADVANCED_QUERY_EXAMPLE_CATEGORIES: AdvancedQueryExampleCategory[] = [
  {
    name: "Quick Commands",
    description: "Common search patterns for immediate use",
    examples: [
      { query: "minAppliedJobFitScore:80", description: "High-priority Applicants (>=80% fit score)" },
      { query: "status:Applied,Screening", description: "Active Applicants in early stages" },
      { query: "recruiterId:unassigned", description: "Unassigned Applicants needing attention" },
      { query: "status:Off", description: "Applicants with no status assigned" },
      { query: "applicationDateStart:2024-01-15", description: "Applicants who applied after Jan 15, 2024" },
      { query: "applicationDateStart:2024-01-08", description: "Applicants who applied after Jan 8, 2024" },
      { query: "status:Offer Extended,Offer Accepted,Hired", description: "Applicants in final hiring stages" },
      { query: "status:Interviewing,Offer Extended,Offer Accepted,Hired", description: "Applicants in hiring pipeline" },
      { query: "positionId:not-applied", description: "Applicants without applied positions" },
      { query: "recruiterId:unassigned", description: "Applicants without assigned recruiter" },
      { query: "minExperienceYears:5 skills:React,Python", description: "Senior developers with key skills" },
    ],
  },
  {
    name: "Basic Search",
    description: "Search by name, email, or phone",
    examples: [
      { query: "name:John", description: "Find Applicants named John" },
      { query: "email:john@example.com", description: "Find Applicant with specific email" },
      { query: "phone:+1234567890", description: "Find Applicant with specific phone" },
      { query: "name:John email:gmail.com", description: "Find John with Gmail address" },
    ],
  },
  {
    name: "Skills & Experience",
    description: "Search by skills and experience",
    examples: [
      { query: "skills:React", description: "Find Applicants with React skills" },
      { query: "skills:Python,JavaScript", description: "Find Applicants with multiple skills" },
      { query: "minExperienceYears:5", description: "Find Applicants with at least 5 years experience" },
      { query: "maxExperienceYears:10", description: "Find Applicants with maximum 10 years experience" },
      { query: "minExperienceYears:3 maxExperienceYears:7", description: "Mid-level Applicants (3-7 years)" },
    ],
  },
  {
    name: "Fit Scores",
    description: "Search by job fit scores",
    examples: [
      { query: "minAppliedJobFitScore:80", description: "Find Applicants with fit score >= 80%" },
      { query: "maxAppliedJobFitScore:30", description: "Find Applicants with fit score <= 30%" },
      { query: "minAppliedJobFitScore:70 maxAppliedJobFitScore:90", description: "Find Applicants with fit score between 70-90%" },
      { query: "minMatchingJobFitScore:75", description: "Find Applicants with good matching job fit" },
      { query: "maxMatchingJobFitScore:50", description: "Find Applicants with low matching job fit" },
    ],
  },
  {
    name: "Status & Position",
    description: "Search by application status and position",
    examples: [
      { query: "status:Applied", description: "Find Applicants with Applied status" },
      { query: "status:Applied,Screening", description: "Find Applicants with multiple statuses" },
      { query: "positionId:pos1,pos2", description: "Find Applicants for specific positions (by ID)" },
      { query: "status:Interviewing,Offer Extended", description: "Applicants in final stages" },
      { query: "status:Rejected,On Hold", description: "Applicants not moving forward" },
    ],
  },
  {
    name: "Location & Education",
    description: "Search by location and education",
    examples: [
      { query: "location:New York", description: "Find Applicants in New York" },
      { query: "location:Bangkok locationOperator:contains", description: "Find Applicants in Bangkok area" },
      { query: "education:MBA", description: "Find Applicants with MBA degree" },
      { query: "education:Computer Science", description: "Find Applicants with specific major" },
      { query: "location:San Francisco education:Engineering", description: "Engineers in San Francisco" },
    ],
  },
  {
    name: "Recruiter & Source",
    description: "Search by assigned recruiter and source",
    examples: [
      { query: "recruiterId:recruiter123", description: "Find Applicants assigned to specific recruiter" },
      { query: "recruiterId:unassigned", description: "Find unassigned Applicants" },
      { query: "selectedSourceIds:source1,source2", description: "Find Applicants from specific sources" },
      { query: "recruiterId:recruiter123 status:Applied", description: "Applied Applicants for specific recruiter" },
    ],
  },
  {
    name: "Time-Based Queries",
    description: "Search by application dates and time periods",
    examples: [
      { query: "applicationDateStart:2024-01-15", description: "Applicants who applied after Jan 15, 2024" },
      { query: "applicationDateStart:2024-01-08", description: "Applicants who applied after Jan 8, 2024" },
      { query: "applicationDateStart:2024-01-01", description: "Applicants who applied after Jan 1, 2024" },
      { query: "applicationDateEnd:2024-01-31", description: "Applicants who applied before Jan 31, 2024" },
      { query: "applicationDateStart:2024-01-01 applicationDateEnd:2024-01-31", description: "Applicants who applied in January 2024" },
      { query: "applicationDateStart:2024-01-01 status:Applied", description: "Recent applications" },
    ],
  },
  {
    name: "Hiring Pipeline",
    description: "Search by hiring stages and status",
    examples: [
      { query: "status:Offer Extended,Offer Accepted,Hired", description: "Applicants in final hiring stages" },
      { query: "status:Interviewing,Offer Extended,Offer Accepted,Hired", description: "Applicants in hiring pipeline" },
      { query: "status:Interviewing", description: "Applicants currently being interviewed" },
      { query: "status:Offer Extended", description: "Applicants with pending offers" },
      { query: "status:Hired", description: "Successfully hired Applicants" },
    ],
  },
  {
    name: "Assignment & Status",
    description: "Search by recruiter assignment and application status",
    examples: [
      { query: "recruiterId:unassigned", description: "Applicants without assigned recruiter" },
      { query: "positionId:not-applied", description: "Applicants without applied positions" },
      { query: "status:Off", description: "Applicants with no status assigned" },
      { query: "status:Applied,Screening", description: "Applicants in early stages" },
      { query: "status:Rejected,On Hold", description: "Applicants not moving forward" },
    ],
  },
  {
    name: "Complex Queries",
    description: "Combine multiple filters for precise searches",
    examples: [
      { query: "minAppliedJobFitScore:80 status:Applied skills:React", description: "High-fit React developers who applied" },
      { query: "location:San Francisco minExperienceYears:3 skills:Python,JavaScript", description: "Experienced developers in SF with Python/JS skills" },
      { query: "minAppliedJobFitScore:70 maxAppliedJobFitScore:90 status:Screening positionId:senior-engineer", description: "Senior engineers in screening with good fit scores" },
      { query: "recruiterId:unassigned minAppliedJobFitScore:60 status:Applied", description: "High-potential unassigned Applicants" },
      { query: "applicationDateStart:2024-01-01 minExperienceYears:5 skills:AI,Machine Learning", description: "Recent senior AI/ML Applicants" },
    ],
  },
];
