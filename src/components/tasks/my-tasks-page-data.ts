import {
  normalizeTaskboardStagesResponse,
  type TaskboardApplicant,
  type MyTasksStage,
} from "@/components/tasks/my-tasks-page-utils";
import type { BoardPosition, BoardRecruiter } from "@/components/tasks/customize-board-utils";
import { safeAll, safeFetch } from "@/lib/safe-fetch";

export interface MyTasksMetadata {
  positions: BoardPosition[];
  recruiters: BoardRecruiter[];
  stages: MyTasksStage[];
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getArrayProperty<T>(value: unknown, propertyName: string): T[] {
  const property = getRecord(value)[propertyName];
  return Array.isArray(property) ? property as T[] : [];
}

export async function fetchMyTasksMetadata(): Promise<MyTasksMetadata> {
  const metadata: MyTasksMetadata = {
    positions: [],
    recruiters: [],
    stages: [],
  };

  try {
    const [stagesResult, recruitersResult, positionsResult] = await safeAll([
      safeFetch("/api/recruitment-stages", { timeoutMs: 8000 }),
      safeFetch("/api/users?role=Recruiter", { timeoutMs: 8000 }),
      safeFetch("/api/positions", { timeoutMs: 8000 }),
    ]);

    if (stagesResult.ok && stagesResult.data) {
      metadata.stages = normalizeTaskboardStagesResponse(stagesResult.data);
    } else {
      console.warn(
        "Skipping failed endpoint /api/recruitment-stages:",
        stagesResult.error || stagesResult.status,
      );
    }

    if (recruitersResult.ok && recruitersResult.data) {
      metadata.recruiters = getArrayProperty<BoardRecruiter>(recruitersResult.data, "users");
    } else {
      console.warn(
        "Skipping failed endpoint /api/users (recruiters):",
        recruitersResult.error || recruitersResult.status,
      );
    }

    if (positionsResult.ok && positionsResult.data) {
      metadata.positions = getArrayProperty<BoardPosition>(positionsResult.data, "data");
    } else {
      console.warn(
        "Skipping failed endpoint /api/positions:",
        positionsResult.error || positionsResult.status,
      );
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }

  return metadata;
}

export async function fetchMyTasksTotalApplicants() {
  try {
    const result = await safeFetch("/api/applicants?forCounts=true", {
      timeoutMs: 8000,
    });
    if (result.ok && result.data) {
      const total = getRecord(result.data).total;
      return typeof total === "number" ? total : 0;
    }

    console.warn(
      "Skipping failed endpoint /api/applicants (counts):",
      result.error || result.status,
    );
  } catch (error) {
    console.error("Error fetching total count:", error);
  }

  return 0;
}

export async function fetchTaskboardApplicantList(
  endpoint: string,
  warningContext: "filtered" | "initial"
): Promise<TaskboardApplicant[]> {
  try {
    const result = await safeFetch(endpoint, { timeoutMs: 6000 });
    if (result.ok && result.data) {
      return Array.isArray(result.data)
        ? result.data
        : getArrayProperty<TaskboardApplicant>(result.data, "data");
    }

    console.warn(
      `Skipping failed endpoint /api/applicants (${warningContext}):`,
      result.error || result.status,
    );
  } catch (error) {
    console.error("Error fetching Applicants:", error);
  }

  return [];
}
