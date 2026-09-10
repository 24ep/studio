import type {
    AveragedEvaluationData,
    EvaluationInterviewer,
    EvaluationRecord,
    EvaluationSkill,
    EvaluationTrait,
} from './types';

export function buildAveragedEvaluationData(evaluations: EvaluationRecord[]): AveragedEvaluationData | null {
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
        return null;
    }

    const traitScoreMap = new Map<string, { scores: number[]; trait: EvaluationTrait }>();
    const skillScoreMap = new Map<string, { scores: number[]; skill: EvaluationSkill }>();
    const uniqueEvaluatorIds = new Set<string>();
    const overallScores: number[] = [];

    evaluations.forEach((evaluation) => {
        addEvaluationOverallScore(evaluation, uniqueEvaluatorIds, overallScores);
        addEvaluationTraitScores(evaluation, traitScoreMap);
        addEvaluationSkillScores(evaluation, skillScoreMap);
    });

    return {
        overallScore: averageScores(overallScores),
        personalityScores: Array.from(traitScoreMap.values()).map(data => ({
            trait: data.trait,
            averageScore: averageScores(data.scores),
            evaluatorCount: data.scores.length,
        })),
        evaluatorCount: uniqueEvaluatorIds.size > 0 ? uniqueEvaluatorIds.size : evaluations.length,
        expertiseScores: Array.from(skillScoreMap.values()).map(data => ({
            skill: data.skill,
            averageScore: averageScores(data.scores),
            evaluatorCount: data.scores.length,
        })),
    };
}

export function buildSingleEvaluationAverage(data: EvaluationRecord | null | undefined): AveragedEvaluationData | null {
    if (!data) return null;

    return {
        overallScore: data.overallScore || 0,
        personalityScores: (data.personalityScores || []).map((personalityScore) => ({
            trait: personalityScore.trait,
            averageScore: personalityScore.score,
            evaluatorCount: 1,
        })),
        evaluatorCount: 1,
        expertiseScores: (data.expertiseScores || []).map((expertiseScore) => ({
            skill: expertiseScore.skill,
            averageScore: expertiseScore.score,
            evaluatorCount: 1,
        })),
    };
}

export function getEvaluationCompletionSummary({
    interviewers,
    allEvaluations,
}: {
    interviewers: EvaluationInterviewer[];
    allEvaluations: EvaluationRecord[];
}) {
    if (interviewers.length === 0) {
        return {
            allEvaluationsComplete: allEvaluations.length > 0,
            completedCount: allEvaluations.length,
        };
    }

    const completedCount = interviewers.filter(interviewer => {
        const evaluation = allEvaluations.find(entry => entry.evaluator?.id === interviewer.userId);
        return Boolean(evaluation?.personalityScores?.length);
    }).length;

    return {
        allEvaluationsComplete: completedCount === interviewers.length,
        completedCount,
    };
}

function addEvaluationOverallScore(
    evaluation: EvaluationRecord,
    uniqueEvaluatorIds: Set<string>,
    overallScores: number[]
) {
    if (evaluation.evaluator?.id) {
        uniqueEvaluatorIds.add(evaluation.evaluator.id);
    }

    if (evaluation.overallScore !== null && evaluation.overallScore !== undefined) {
        overallScores.push(evaluation.overallScore);
    }
}

function addEvaluationTraitScores(
    evaluation: EvaluationRecord,
    traitScoreMap: Map<string, { scores: number[]; trait: EvaluationTrait }>
) {
    if (!Array.isArray(evaluation.personalityScores)) {
        return;
    }

    evaluation.personalityScores.forEach((personalityScore) => {
        if (!personalityScore.trait || personalityScore.score === undefined || personalityScore.score === null) return;

        const traitId = personalityScore.trait.id;
        if (!traitScoreMap.has(traitId)) {
            traitScoreMap.set(traitId, { scores: [], trait: personalityScore.trait });
        }
        traitScoreMap.get(traitId)!.scores.push(personalityScore.score);
    });
}

function addEvaluationSkillScores(
    evaluation: EvaluationRecord,
    skillScoreMap: Map<string, { scores: number[]; skill: EvaluationSkill }>
) {
    if (!Array.isArray(evaluation.expertiseScores)) {
        return;
    }

    evaluation.expertiseScores.forEach((expertiseScore) => {
        if (!expertiseScore.skill || expertiseScore.score === undefined) return;

        const skillId = expertiseScore.skill.id;
        if (!skillScoreMap.has(skillId)) {
            skillScoreMap.set(skillId, { scores: [], skill: expertiseScore.skill });
        }
        skillScoreMap.get(skillId)!.scores.push(expertiseScore.score);
    });
}

function averageScores(scores: number[]) {
    return scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;
}
