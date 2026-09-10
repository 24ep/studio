import type { Task } from "@/components/tasks/TaskCard";
import type { TaskboardApplicant } from "./my-tasks-page-types";

export function haveTaskboardApplicantSnapshotsChanged(currentApplicants: TaskboardApplicant[], nextApplicants: TaskboardApplicant[]) {
  const toSnapshot = (applicants: TaskboardApplicant[]) =>
    applicants.map((applicant) => ({
      id: applicant.id,
      status: applicant.status,
      updatedAt: applicant.updatedAt,
    }));

  return JSON.stringify(toSnapshot(nextApplicants)) !== JSON.stringify(toSnapshot(currentApplicants));
}

export function convertApplicantsToTasks(applicants: TaskboardApplicant[]): Task[] {
  return applicants.map((applicant) => {
    const fitScore = typeof applicant.fitScore === "number" ? applicant.fitScore : undefined;

    return {
      id: applicant.id,
      title: applicant.name || "",
      description: applicant.parsedData?.summary || "",
      email: applicant.email,
      status: applicant.statusId || applicant.status || "",
      priority: (fitScore || 0) > 0.8 ? "high" : (fitScore || 0) > 0.6 ? "medium" : "low",
      assignee: applicant.recruiter ? {
        id: applicant.recruiter.id,
        name: applicant.recruiter.name,
        avatarUrl: applicant.recruiter.avatarUrl,
      } : undefined,
      dueDate: applicant.applicationDate,
      tags: applicant.position?.title ? [applicant.position.title] : [],
      createdAt: applicant.createdAt,
      updatedAt: applicant.updatedAt,
      fitScore,
      avatarUrl: applicant.avatarUrl,
      skills: applicant.parsedData?.skills || [],
      originalapplicant: applicant,
    };
  });
}

export function getTaskApplicantDisplayName(applicant: TaskboardApplicant | Task): string {
  const name = "name" in applicant ? applicant.name : undefined;
  if (typeof name === "string" && name.trim() !== "") {
    return name;
  }

  const title = "title" in applicant ? applicant.title : undefined;
  return typeof title === "string" && title.trim() !== "" ? title : "Applicant";
}
