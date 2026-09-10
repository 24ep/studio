import {
  runEvaluationTemplateApplyTasks,
  type EvaluationTemplateApplyTask,
  type EvaluationTemplateApplyTaskResult,
} from "./evaluation-config-utils";

export function getEvaluationTemplateApplyTaskUrl(positionId: string, task: EvaluationTemplateApplyTask) {
  switch (task.kind) {
    case "expertise-group":
      return `/api/v1/positions/${positionId}/evaluation/expertise-groups`;
    case "expertise-skill":
      return `/api/positions/${positionId}/expertise-skills`;
    case "personality-group":
      return `/api/v1/positions/${positionId}/evaluation/personality-groups`;
    case "personality-trait":
      return `/api/positions/${positionId}/personality-traits`;
  }
}

export async function applyEvaluationTemplateTasks(
  positionId: string,
  tasks: EvaluationTemplateApplyTask[],
): Promise<EvaluationTemplateApplyTaskResult[]> {
  return runEvaluationTemplateApplyTasks(tasks, async (task) => {
    try {
      const response = await fetch(getEvaluationTemplateApplyTaskUrl(positionId, task), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task.payload),
      });

      return {
        ok: response.ok || response.status === task.duplicateOkStatus,
        status: response.status,
        id: task.id,
        name: task.name,
      };
    } catch {
      return { ok: false, id: task.id, name: task.name };
    }
  });
}
