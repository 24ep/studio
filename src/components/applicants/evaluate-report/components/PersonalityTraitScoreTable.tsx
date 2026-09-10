"use client";

import { getScoreColorInfo } from '@/components/ui/score-color';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EvaluationRecord, GroupedTrait } from '../types';
import {
  formatPersonalityScore,
  getEvaluatorsForGroup,
  getTraitScoreByEvaluator,
} from '../utils';
import { getPersonalityScoreBorderClass } from './personality-evaluation-utils';

type Evaluator = ReturnType<typeof getEvaluatorsForGroup>[number];
type Trait = GroupedTrait['traits'][number];

interface PersonalityTraitScoreTableProps {
  group: GroupedTrait;
  evaluators: Evaluator[];
  allEvaluations: EvaluationRecord[];
}

interface PersonalityTraitScoreRowProps {
  trait: Trait;
  evaluators: Evaluator[];
  allEvaluations: EvaluationRecord[];
}

interface EvaluatorTraitScoreProps {
  traitId: string;
  evaluator: Evaluator;
  allEvaluations: EvaluationRecord[];
}

export function PersonalityTraitScoreTable({
  group,
  evaluators,
  allEvaluations,
}: PersonalityTraitScoreTableProps) {
  return (
    <div className="border-t border-gray-200 bg-white print:block">
      <div className="p-4">
        <Table className="border-0">
          <TableHeader>
            <TableRow className="border-0">
              <TableHead className="font-semibold text-gray-900 text-left w-1/2 border-0">
                Trait
              </TableHead>
              {evaluators.map((evaluator) => (
                <TableHead
                  key={evaluator.id}
                  className="text-center font-semibold text-gray-900 border-0"
                >
                  {evaluator.name}
                </TableHead>
              ))}
              <TableHead className="text-center font-semibold text-gray-900 border-0">
                Average
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.traits.map((trait) => (
              <PersonalityTraitScoreRow
                key={trait.id}
                allEvaluations={allEvaluations}
                evaluators={evaluators}
                trait={trait}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PersonalityTraitScoreRow({
  trait,
  evaluators,
  allEvaluations,
}: PersonalityTraitScoreRowProps) {
  const traitColorInfo = getScoreColorInfo(trait.percentage);

  return (
    <TableRow className="border-0 bg-secondary/50">
      <TableCell className="font-medium text-gray-900 text-left w-1/2 border-0">
        <div className="flex flex-col">
          <span>{trait.name}</span>
          {trait.description && (
            <span className="text-xs text-gray-500 mt-1 font-normal">{trait.description}</span>
          )}
        </div>
      </TableCell>
      {evaluators.map((evaluator) => (
        <TableCell key={evaluator.id} className="text-center border-0">
          <EvaluatorTraitScore
            allEvaluations={allEvaluations}
            evaluator={evaluator}
            traitId={trait.id}
          />
        </TableCell>
      ))}
      <TableCell className="text-center border-0">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${traitColorInfo.bg} ${traitColorInfo.text} min-w-[60px] text-center`}>
          {trait.percentage.toFixed(1)}%
        </span>
      </TableCell>
    </TableRow>
  );
}

function EvaluatorTraitScore({
  traitId,
  evaluator,
  allEvaluations,
}: EvaluatorTraitScoreProps) {
  const score = getTraitScoreByEvaluator(traitId, evaluator.id, allEvaluations);

  if (score === null) {
    return <span className="text-sm text-gray-400">-</span>;
  }

  const scorePercentage = ((score - 1) / 4) * 100;
  const scoreColorInfo = getScoreColorInfo(scorePercentage);
  const borderClass = getPersonalityScoreBorderClass(scoreColorInfo.bg);

  return (
    <span className={`text-sm font-semibold px-2 py-1 rounded border-2 bg-transparent ${borderClass} ${scoreColorInfo.text}`}>
      {formatPersonalityScore(score)}
    </span>
  );
}
