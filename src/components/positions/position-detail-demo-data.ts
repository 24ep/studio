import type { Position } from "@/lib/types";

const attributes = {
  location: "Bangkok, Thailand",
  employmentType: "Full-time",
  workModel: "Hybrid",
  salaryRange: "THB 90,000–130,000 / month",
  targetStartDate: "2026-10-01",
  hiringManagerName: "Maya Chen",
  successOutcomes: [
    "First 30 days: Learn the product, design system, and release workflow",
    "First 60 days: Ship a customer-facing workflow with the product trio",
    "First 90 days: Own frontend quality and delivery for a product area",
  ],
  coreResponsibilities: [
    "Build accessible, responsive product experiences in React and TypeScript",
    "Partner with product and design from discovery through release",
    "Improve frontend architecture, performance, testing, and observability",
    "Mentor engineers and raise the quality bar through thoughtful reviews",
  ],
  requiredSkills: ["React", "TypeScript", "Next.js", "Accessibility", "Testing"],
  preferredSkills: ["Design systems", "GraphQL", "Playwright", "Analytics"],
  matchCriteriaPreview: [
    "Frontend engineering depth | 35%",
    "Product thinking and ownership | 25%",
    "React and TypeScript expertise | 25%",
    "Communication and collaboration | 15%",
  ],
};

export const positionDetailDemo: Position = {
  id: "preview",
  title: "Frontend Developer",
  department: "Product & Engineering",
  description:
    "Join our product engineering team to build thoughtful, high-quality hiring experiences used by teams across Southeast Asia. You will shape frontend architecture while working closely with product, design, and backend partners.",
  matchCriteria:
    "Strong frontend fundamentals, meaningful React and TypeScript experience, product judgment, and a collaborative approach to delivery.",
  isOpen: true,
  positionLevel: "Senior individual contributor",
  positionAttribute: "Growth hire",
  probationPeriodDays: 90,
  probationEvaluationFrequencyDays: 30,
  recruiterId: "11111111-1111-4111-8111-111111111111",
  recruiterName: "Nina Patel",
  customAttributes: attributes,
  custom_attributes: attributes,
  createdAt: "2026-08-01T09:00:00.000Z",
  updatedAt: "2026-08-09T09:00:00.000Z",
  applicants: [],
  applicantStats: { totalApplied: 24, appliedStatusCount: 7, totalMatching: 11 },
  pipelineStats: { total: 24, shortlisted: 8, interviews: 4, offers: 1 },
  hiringTeamCount: 3,
};
