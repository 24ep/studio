import { describe, expect, it } from "vitest";

import {
  filterEvaluationTemplates,
  getEvaluationTemplateCounts,
} from "./mobile-template-selector-utils";
import type { EvaluationTemplate } from "./EvaluationConfigTabParts";

const templates: EvaluationTemplate[] = [
  {
    id: "template-1",
    name: "Engineering",
    description: "Backend focused",
    templateSkills: [{ id: "skill-1", skill: { id: "skill", name: "Node" } }],
    templatePersonalityTraits: [{ id: "trait-1", trait: { id: "trait", name: "Ownership" } }],
  },
  {
    id: "template-2",
    name: "Sales",
    description: "Customer facing",
  },
];

describe("mobile-template-selector-utils", () => {
  it("filters templates by name or description", () => {
    expect(filterEvaluationTemplates(templates, "engineering")).toEqual([templates[0]]);
    expect(filterEvaluationTemplates(templates, "customer")).toEqual([templates[1]]);
    expect(filterEvaluationTemplates(templates, "  ")).toEqual(templates);
    expect(filterEvaluationTemplates(templates, "missing")).toEqual([]);
  });

  it("counts skills and traits defensively", () => {
    expect(getEvaluationTemplateCounts(templates[0])).toEqual({
      skillCount: 1,
      traitCount: 1,
    });
    expect(getEvaluationTemplateCounts(templates[1])).toEqual({
      skillCount: 0,
      traitCount: 0,
    });
  });
});
