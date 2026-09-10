import type { EvaluationTemplate } from "./EvaluationConfigTabParts";

export function filterEvaluationTemplates(
  templates: EvaluationTemplate[],
  searchTerm: string,
): EvaluationTemplate[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return templates;
  }

  return templates.filter((template) => (
    template.name.toLowerCase().includes(normalizedSearch) ||
    Boolean(template.description?.toLowerCase().includes(normalizedSearch))
  ));
}

export function getEvaluationTemplateCounts(template: EvaluationTemplate) {
  return {
    skillCount: template.templateSkills?.length ?? 0,
    traitCount: template.templatePersonalityTraits?.length ?? 0,
  };
}
