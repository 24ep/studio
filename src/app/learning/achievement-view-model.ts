import type {
  CareerSnapshot,
  LearningRecord,
  LearningResponse,
} from "./learning-workspace-model";

export type AchievementSkillArea = {
  title: string;
  description: string;
  impact: number;
  strength: string;
  evidence: string;
  completedAt: string | null;
};

export type AchievementRecommendedCourse = {
  id: string;
  title: string;
  category: string;
  description: string;
  durationHours: number;
};

export type AchievementViewModel = {
  currentReadiness: number;
  nextReadiness: number;
  targetReadiness: number;
  currentRoleTitle: string;
  targetRoleTitle: string;
  intermediateRoleTitle: string;
  activeCertificates: number;
  skillAreas: AchievementSkillArea[];
  recommendedCourse: AchievementRecommendedCourse | null;
};

export function learningRecords(payload: LearningResponse) {
  return payload.resource?.records || payload.records || [];
}

export function learningText(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
    return value.slice(0, 10);
  return String(value).replace(/_/g, " ");
}

export function learningNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function learningRecordValue(
  record: LearningRecord,
  camel: string,
  snake?: string,
) {
  return record[camel] ?? (snake ? record[snake] : undefined);
}

export function learningNormalizeStatus(status: unknown) {
  return String(status || "active").toLowerCase();
}

export function learningFormatDate(value: unknown) {
  if (!value) return "No date";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return learningText(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function learningIsCourseActive(course: LearningRecord) {
  const value = learningRecordValue(course, "isActive", "is_active");
  if (value === undefined) return true;
  return value === true || value === "true" || value === 1;
}

function completedCourseEvidence(
  courses: LearningRecord[],
  enrollments: LearningRecord[],
) {
  const completedEnrollments = enrollments.filter(
    (item) => learningNormalizeStatus(item.status) === "completed",
  );
  const completedCourses = courses.filter((course) =>
    completedEnrollments.some(
      (item) =>
        String(learningRecordValue(item, "courseId", "course_id")) ===
        course.id,
    ),
  );
  return { completedCourses, completedEnrollments };
}

function recommendedCourse(
  courses: LearningRecord[],
  enrollments: LearningRecord[],
  career: CareerSnapshot | null,
  targetRole: CareerSnapshot["roles"][number] | null,
): AchievementRecommendedCourse | null {
  if (targetRole?.course) {
    return {
      id: targetRole.course.id,
      title: targetRole.course.title,
      category: targetRole.course.category || "General",
      description:
        targetRole.course.description || `Build evidence for ${targetRole.title}.`,
      durationHours: targetRole.course.durationHours || 0,
    };
  }

  const course = courses.find(
    (item) =>
      learningIsCourseActive(item) &&
      !enrollments.some(
        (enrollment) =>
          String(
            learningRecordValue(enrollment, "courseId", "course_id"),
          ) === item.id,
      ),
  );
  if (!course) return null;

  return {
    id: course.id,
    title: learningText(course.title, "Recommended learning"),
    category: learningText(course.category, "General"),
    description: learningText(
      course.description,
      `Build evidence for ${targetRole?.title || career?.goal?.title || "your career goal"}.`,
    ),
    durationHours: learningNumber(
      learningRecordValue(course, "durationHours", "duration_hours"),
    ),
  };
}

export function buildAchievementViewModel({
  courses,
  enrollments,
  certificates,
  career,
}: {
  courses: LearningRecord[];
  enrollments: LearningRecord[];
  certificates: LearningRecord[];
  career: CareerSnapshot | null;
}): AchievementViewModel {
  const progressAverage = enrollments.length
    ? Math.round(
        enrollments.reduce(
          (total, record) => total + learningNumber(record.progress),
          0,
        ) / enrollments.length,
      )
    : 0;
  const selectedGoalTitle = career?.goal?.title.replace(/^Career goal:\s*/i, "");
  const targetRole =
    career?.roles.find((role) => role.title === selectedGoalTitle) ||
    career?.roles[0] ||
    null;
  const activeCertificates = certificates.filter(
    (item) => learningNormalizeStatus(item.status) === "active",
  ).length;
  const currentReadiness = Math.min(
    100,
    Math.max(0, progressAverage + Math.min(20, activeCertificates * 4)),
  );
  const targetReadiness = targetRole?.readiness || 0;
  const nextReadiness = targetReadiness
    ? Math.min(100, Math.round((currentReadiness + targetReadiness) / 2))
    : currentReadiness;
  const { completedCourses, completedEnrollments } = completedCourseEvidence(
    courses,
    enrollments,
  );
  const skillDefinitions = targetRole
    ? [
        ...targetRole.strengths.map((skill, index) => ({
          ...skill,
          strength: "Demonstrated",
          impact: Math.max(5, 14 - index * 2),
        })),
        ...targetRole.gaps.map((skill, index) => ({
          ...skill,
          strength: "To build",
          impact: Math.max(4, 10 - index * 2),
        })),
      ].slice(0, 5)
    : career?.evidence.skills
        .map((title, index) => ({
          title,
          detail: "Recorded on your employee profile.",
          strength: "Profile skill",
          impact: Math.max(4, 12 - index * 2),
        }))
        .slice(0, 5) || [];

  const skillAreas = skillDefinitions.map((skill) => {
    const skillWords = skill.title
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);
    const course = completedCourses.find((item) =>
      skillWords.some((word) =>
        `${learningText(item.title, "")} ${learningText(item.category, "")} ${learningText(item.description, "")}`
          .toLowerCase()
          .includes(word),
      ),
    );
    const enrollment = course
      ? completedEnrollments.find(
          (item) =>
            String(learningRecordValue(item, "courseId", "course_id")) ===
            course.id,
        )
      : undefined;
    return {
      title: skill.title,
      description: skill.detail,
      impact: skill.impact,
      strength: skill.strength,
      evidence: course
        ? learningText(course.title, "Completed learning")
        : "No completed course evidence yet",
      completedAt: enrollment
        ? learningFormatDate(
            learningRecordValue(enrollment, "completedAt", "completed_at"),
          )
        : null,
    };
  });

  return {
    currentReadiness,
    nextReadiness,
    targetReadiness,
    currentRoleTitle: career?.employee.jobTitle || "Employee role not linked",
    targetRoleTitle: targetRole?.title || "Choose a career goal",
    intermediateRoleTitle:
      targetRole?.intermediateRole || "Build a learning plan",
    activeCertificates,
    skillAreas,
    recommendedCourse: recommendedCourse(
      courses,
      enrollments,
      career,
      targetRole,
    ),
  };
}
