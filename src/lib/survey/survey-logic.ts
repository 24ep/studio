import type { SurveyQuestionInput } from "./survey-contracts";

export interface LogicValidationIssue {
  code: "cycle" | "missing_target" | "deleted_reference" | "unreachable" | "conflict";
  message: string;
  questionId?: string;
}

export function validateSurveyLogic(questions: SurveyQuestionInput[]): LogicValidationIssue[] {
  const issues: LogicValidationIssue[] = [];
  const questionIds = new Set(questions.map((question) => question.id).filter(Boolean) as string[]);
  const graph = new Map<string, Set<string>>();

  for (const question of questions) {
    if (!question.id) continue;
    const actions = new Set<string>();
    for (const rule of question.logic) {
      const targetId = rule.targetQuestionId;
      if (["show", "hide", "require_explanation"].includes(rule.action) && !targetId) {
        issues.push({
          code: "missing_target",
          message: `“${question.text}” has a ${rule.action.replaceAll("_", " ")} rule without a target question.`,
          questionId: question.id,
        });
      }
      if (targetId && !questionIds.has(targetId)) {
        issues.push({
          code: "deleted_reference",
          message: `“${question.text}” references a question that no longer exists.`,
          questionId: question.id,
        });
      }
      if (targetId) {
        const edges = graph.get(question.id) || new Set<string>();
        edges.add(targetId);
        graph.set(question.id, edges);
        const conflictKey = `${targetId}:${rule.action}`;
        const oppositeKey = `${targetId}:${rule.action === "show" ? "hide" : "show"}`;
        if (actions.has(oppositeKey)) {
          issues.push({
            code: "conflict",
            message: `“${question.text}” both shows and hides the same question.`,
            questionId: question.id,
          });
        }
        actions.add(conflictKey);
      }
    }
  }

  for (const questionId of graph.keys()) {
    if (hasCycle(questionId, graph, new Set(), new Set())) {
      issues.push({
        code: "cycle",
        message: "Branching rules contain a cycle. Remove a rule that routes back to an earlier question.",
        questionId,
      });
      break;
    }
  }

  return issues;
}

function hasCycle(
  node: string,
  graph: Map<string, Set<string>>,
  visiting: Set<string>,
  visited: Set<string>,
): boolean {
  if (visiting.has(node)) return true;
  if (visited.has(node)) return false;
  visiting.add(node);
  for (const neighbor of graph.get(node) || []) {
    if (hasCycle(neighbor, graph, visiting, visited)) return true;
  }
  visiting.delete(node);
  visited.add(node);
  return false;
}

export function conditionMatches(
  actual: unknown,
  operator: string,
  expected?: unknown,
): boolean {
  switch (operator) {
    case "equals":
      return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
    case "not_equals":
      return Array.isArray(actual) ? !actual.includes(expected) : actual !== expected;
    case "contains":
      return Array.isArray(actual)
        ? actual.includes(expected)
        : String(actual ?? "").toLocaleLowerCase().includes(String(expected ?? "").toLocaleLowerCase());
    case "greater_than":
      return Number(actual) > Number(expected);
    case "less_than":
      return Number(actual) < Number(expected);
    case "answered":
      return actual !== undefined && actual !== null && actual !== "" && (!Array.isArray(actual) || actual.length > 0);
    case "not_answered":
      return actual === undefined || actual === null || actual === "" || (Array.isArray(actual) && actual.length === 0);
    default:
      return false;
  }
}

export function validateRequiredAnswers(
  questions: Array<Pick<SurveyQuestionInput, "id" | "text" | "type" | "isRequired" | "logic">>,
  answers: Record<string, unknown>,
) {
  const visible = visibleQuestionIds(questions, answers);
  return questions
    .filter((question) => question.id && visible.has(question.id) && question.isRequired && question.type !== "information")
    .filter((question) => !conditionMatches(answers[question.id!], "answered"))
    .map((question) => ({ questionId: question.id!, message: `Answer “${question.text}” before submitting.` }));
}

export function visibleQuestionIds(
  questions: Array<Pick<SurveyQuestionInput, "id" | "logic">>,
  answers: Record<string, unknown>,
) {
  const all = new Set(questions.map(question => question.id).filter(Boolean) as string[]);
  const showTargets = new Set<string>();
  const matchedShowTargets = new Set<string>();
  const matchedHideTargets = new Set<string>();
  for (const source of questions) {
    for (const rule of source.logic || []) {
      if (!rule.targetQuestionId) continue;
      const matches = rule.conditions.every(condition => conditionMatches(answers[condition.questionId], condition.operator, condition.value));
      if (rule.action === "show") { showTargets.add(rule.targetQuestionId); if (matches) matchedShowTargets.add(rule.targetQuestionId); }
      if (rule.action === "hide" && matches) matchedHideTargets.add(rule.targetQuestionId);
    }
  }
  for (const target of showTargets) if (!matchedShowTargets.has(target)) all.delete(target);
  for (const target of matchedHideTargets) all.delete(target);
  return all;
}

export function calculateNps(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value) && value >= 0 && value <= 10);
  const promoters = valid.filter((value) => value >= 9).length;
  const passives = valid.filter((value) => value >= 7 && value <= 8).length;
  const detractors = valid.filter((value) => value <= 6).length;
  const score = valid.length === 0
    ? null
    : Math.round(((promoters - detractors) / valid.length) * 100);
  return { promoters, passives, detractors, score, responseCount: valid.length };
}

export function applyAnonymousThreshold<T>(
  rows: T[],
  getCount: (row: T) => number,
  threshold: number,
) {
  return rows.map((row) => ({
    row: getCount(row) >= threshold ? row : null,
    suppressed: getCount(row) < threshold,
  }));
}
