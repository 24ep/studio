import { describe, expect, it } from "vitest";

import { applyAnonymousThreshold, calculateNps, validateRequiredAnswers, validateSurveyLogic } from "./survey-logic";
import type { SurveyQuestionInput } from "./survey-contracts";

const sectionId = "00000000-0000-4000-8000-000000000001";
const firstId = "00000000-0000-4000-8000-000000000002";
const secondId = "00000000-0000-4000-8000-000000000003";

function question(overrides: Partial<SurveyQuestionInput>): SurveyQuestionInput {
  return {
    id: firstId,
    sectionId,
    type: "rating",
    text: "How supported do you feel?",
    isRequired: true,
    sortOrder: 0,
    config: {},
    logic: [],
    tags: [],
    ...overrides,
  };
}

describe("survey logic", () => {
  it("rejects branching cycles", () => {
    const questions = [
      question({
        logic: [{
          conditions: [{ questionId: firstId, operator: "equals", value: 1 }],
          action: "show",
          targetQuestionId: secondId,
        }],
      }),
      question({
        id: secondId,
        text: "Tell us more",
        logic: [{
          conditions: [{ questionId: secondId, operator: "answered" }],
          action: "show",
          targetQuestionId: firstId,
        }],
      }),
    ];

    expect(validateSurveyLogic(questions).some((issue) => issue.code === "cycle")).toBe(true);
  });

  it("validates required answers without treating information blocks as questions", () => {
    const issues = validateRequiredAnswers([
      question({}),
      question({ id: secondId, type: "information", text: "Context", isRequired: true }),
    ], {});
    expect(issues).toEqual([{ questionId: firstId, message: "Answer “How supported do you feel?” before submitting." }]);
  });

  it("does not require a conditionally hidden question", () => {
    const questions = [
      question({
        isRequired: false,
        logic: [{
          conditions: [{ questionId: firstId, operator: "equals", value: 1 }],
          action: "show",
          targetQuestionId: secondId,
        }],
      }),
      question({ id: secondId, text: "Tell us more", type: "long_text", isRequired: true }),
    ];
    expect(validateRequiredAnswers(questions, { [firstId]: 2 })).toEqual([]);
    expect(validateRequiredAnswers(questions, { [firstId]: 1 })).toEqual([
      { questionId: secondId, message: "Answer “Tell us more” before submitting." },
    ]);
  });

  it("calculates NPS from promoters, passives, and detractors", () => {
    expect(calculateNps([10, 9, 8, 6, 3])).toEqual({
      promoters: 2,
      passives: 1,
      detractors: 2,
      score: 0,
      responseCount: 5,
    });
  });

  it("suppresses groups below the anonymous threshold", () => {
    expect(applyAnonymousThreshold([{ count: 4 }, { count: 5 }], (row) => row.count, 5))
      .toEqual([
        { row: null, suppressed: true },
        { row: { count: 5 }, suppressed: false },
      ]);
  });
});
