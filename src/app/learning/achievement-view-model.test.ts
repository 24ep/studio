import { describe, expect, it } from "vitest";

import {
  buildAchievementViewModel,
  learningIsCourseActive,
  learningRecordValue,
  learningRecords,
} from "./achievement-view-model";
import type {
  CareerSnapshot,
  LearningRecord,
} from "./learning-workspace-model";

const course = (values: Partial<LearningRecord> & { id: string }) =>
  values as LearningRecord;

const career: CareerSnapshot = {
  employee: {
    id: "employee-1",
    name: "A Person",
    jobTitle: "Analyst",
    department: "Data",
  },
  evidence: {
    skills: ["SQL"],
    completedCourses: 1,
    verifiedCertificates: 1,
  },
  roles: [
    {
      id: "role-1",
      title: "Senior Analyst",
      department: "Data",
      readiness: 90,
      intermediateRole: "Lead Analyst",
      description: "Lead complex analysis.",
      strengths: [
        { title: "Leadership", detail: "Lead analytical delivery." },
      ],
      gaps: [{ title: "Strategy", detail: "Build strategic planning." }],
      course: null,
    },
  ],
  goal: { id: "goal-1", title: "Career goal: Senior Analyst" },
};

describe("achievement view model", () => {
  it("prefers nested resource records and supports camel/snake fields", () => {
    const nested = course({ id: "nested" });
    const flat = course({ id: "flat" });
    expect(
      learningRecords({ resource: { records: [nested] }, records: [flat] }),
    ).toEqual([nested]);
    expect(
      learningRecordValue(
        course({ id: "course-1", course_id: "snake-value" }),
        "courseId",
        "course_id",
      ),
    ).toBe("snake-value");
  });

  it("treats missing active state as active and explicit false as inactive", () => {
    expect(learningIsCourseActive(course({ id: "default-active" }))).toBe(true);
    expect(
      learningIsCourseActive(course({ id: "inactive", is_active: false })),
    ).toBe(false);
  });

  it("builds readiness and completed-course evidence from authoritative records", () => {
    const model = buildAchievementViewModel({
      courses: [
        course({
          id: "leadership-course",
          title: "Leadership Foundations",
          category: "Leadership",
          description: "Build leadership capability.",
          is_active: true,
        }),
      ],
      enrollments: [
        course({
          id: "enrollment-1",
          course_id: "leadership-course",
          status: "completed",
          progress: 80,
          completed_at: "2026-08-01T00:00:00.000Z",
        }),
      ],
      certificates: [course({ id: "certificate-1", status: "active" })],
      career,
    });

    expect(model.currentReadiness).toBe(84);
    expect(model.targetReadiness).toBe(90);
    expect(model.nextReadiness).toBe(87);
    expect(model.currentRoleTitle).toBe("Analyst");
    expect(model.targetRoleTitle).toBe("Senior Analyst");
    expect(model.skillAreas[0]).toMatchObject({
      title: "Leadership",
      evidence: "Leadership Foundations",
      strength: "Demonstrated",
    });
  });

  it("recommends the first active course that is not already enrolled", () => {
    const model = buildAchievementViewModel({
      courses: [
        course({ id: "taken", title: "Taken", is_active: true }),
        course({
          id: "next",
          title: "Next Course",
          category: "Data",
          description: "Continue growing.",
          duration_hours: 2,
          is_active: true,
        }),
      ],
      enrollments: [course({ id: "e1", course_id: "taken", progress: 20 })],
      certificates: [],
      career: null,
    });

    expect(model.recommendedCourse).toMatchObject({
      id: "next",
      title: "Next Course",
      durationHours: 2,
    });
  });
});
