"use client";

import { Card } from '@/components/ui/card';
import { getScoreColorInfo } from '@/components/ui/score-color';
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  SortableNativeHeader,
  type SortDirection,
  sortRowsByColumn,
  type SortValueResolverMap,
} from '@/components/ui/sortable-table';
import type { EvaluationRecord, GroupedTrait } from '../types';
import {
  formatPersonalityScore,
  getEvaluatorsForGroup,
  getTraitScoreByEvaluator,
} from '../utils';

type Evaluator = ReturnType<typeof getEvaluatorsForGroup>[number];
type Trait = GroupedTrait['traits'][number];

interface PersonalityGroupListProps {
  personalityGroups: GroupedTrait[];
  allEvaluations: EvaluationRecord[];
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
}

export function PersonalityGroupList({
  personalityGroups,
  allEvaluations,
  expandedGroups,
  toggleGroup,
}: PersonalityGroupListProps) {
  return (
    <div className="space-y-3">
      {personalityGroups.map((group) => (
        <PersonalityGroupCard
          key={group.groupId}
          allEvaluations={allEvaluations}
          group={group}
          isExpanded={expandedGroups.has(group.groupId)}
          toggleGroup={toggleGroup}
        />
      ))}
    </div>
  );
}

interface PersonalityGroupCardProps {
  group: GroupedTrait;
  allEvaluations: EvaluationRecord[];
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
}

function PersonalityGroupCard({
  group,
  allEvaluations,
  isExpanded,
  toggleGroup,
}: PersonalityGroupCardProps) {
  const evaluators = isExpanded ? getEvaluatorsForGroup(group, allEvaluations) : [];

  return (
    <Card className="shadow-sm border border-border">
      <PersonalityGroupHeader
        group={group}
        isExpanded={isExpanded}
        toggleGroup={toggleGroup}
      />
      {isExpanded && evaluators.length > 0 && (
        <PersonalityTraitScoreTable
          allEvaluations={allEvaluations}
          evaluators={evaluators}
          group={group}
        />
      )}
    </Card>
  );
}

interface PersonalityGroupHeaderProps {
  group: GroupedTrait;
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
}

function PersonalityGroupHeader({
  group,
  isExpanded,
  toggleGroup,
}: PersonalityGroupHeaderProps) {
  const averageScore = getGroupAverageScore(group);
  const colorInfo = getScoreColorInfo(averageScore);
  const ExpansionIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      onClick={() => toggleGroup(group.groupId)}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors no-print rounded-t-lg"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <ExpansionIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.groupColor }}
        />
        <span className="text-sm font-semibold text-foreground truncate">
          {group.groupName}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Average</p>
          <p className={`text-sm font-bold ${colorInfo.text}`}>
            {averageScore.toFixed(1)}%
          </p>
        </div>
        <div className="w-16 bg-muted rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${averageScore}%`,
              backgroundColor: group.groupColor,
            }}
          />
        </div>
      </div>
    </button>
  );
}

interface PersonalityTraitScoreTableProps {
  group: GroupedTrait;
  evaluators: Evaluator[];
  allEvaluations: EvaluationRecord[];
}

function PersonalityTraitScoreTable({
  group,
  evaluators,
  allEvaluations,
}: PersonalityTraitScoreTableProps) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const resolverMap = React.useMemo<SortValueResolverMap<Trait & { average: number }>>(() => {
    const evaluatorsMap: SortValueResolverMap<Trait & { average: number }> = {};
    for (const evaluator of evaluators) {
      evaluatorsMap[`evaluator-${evaluator.id}`] = entry => getTraitScoreByEvaluator(entry.id, evaluator.id, allEvaluations);
    }
    return {
      trait: entry => entry.name || '',
      average: entry => entry.average,
      ...evaluatorsMap,
    };
  }, [allEvaluations, evaluators]);
  const sortedTraits = React.useMemo(
    () => sortRowsByColumn(
      group.traits.map(trait => ({ ...trait, average: trait.percentage })),
      sortColumn,
      sortDirection,
      resolverMap,
    ),
    [group.traits, sortColumn, sortDirection, resolverMap],
  );
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  return (
    <div className="border-t border-border bg-card print:block">
      <div className="p-4">
        <Table className="border-0">
          <TableHeader>
            <TableRow className="border-0">
              <SortableNativeHeader
                column="trait"
                label="Trait"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="font-semibold text-foreground text-left w-1/2 border-0"
              />
              {evaluators.map((evaluator) => (
                <SortableNativeHeader
                  key={evaluator.id}
                  column={`evaluator-${evaluator.id}`}
                  label={evaluator.name}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-center font-semibold text-foreground border-0"
                />
              ))}
              <SortableNativeHeader
                column="average"
                label="Average"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="text-center font-semibold text-foreground border-0"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTraits.map((trait) => (
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

interface PersonalityTraitScoreRowProps {
  trait: Trait;
  evaluators: Evaluator[];
  allEvaluations: EvaluationRecord[];
}

function PersonalityTraitScoreRow({
  trait,
  evaluators,
  allEvaluations,
}: PersonalityTraitScoreRowProps) {
  const traitColorInfo = getScoreColorInfo(trait.percentage);

  return (
    <TableRow className="border-0 bg-secondary/50">
      <TableCell className="font-medium text-foreground text-left w-1/2 border-0">
        <div className="flex flex-col">
          <span>{trait.name}</span>
          {trait.description && (
            <span className="text-xs text-muted-foreground mt-1 font-normal whitespace-normal break-words">
              {trait.description}
            </span>
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

interface EvaluatorTraitScoreProps {
  traitId: string;
  evaluator: Evaluator;
  allEvaluations: EvaluationRecord[];
}

function EvaluatorTraitScore({
  traitId,
  evaluator,
  allEvaluations,
}: EvaluatorTraitScoreProps) {
  const score = getTraitScoreByEvaluator(traitId, evaluator.id, allEvaluations);

  if (score === null) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const scorePercentage = ((score - 1) / 4) * 100;
  const scoreColorInfo = getScoreColorInfo(scorePercentage);
  const borderClass = scoreColorInfo.bg.replace('bg-', 'border-');
  const textClass = scoreColorInfo.bg.replace('bg-', 'text-');

  return (
    <span className={`text-sm font-semibold px-2 py-1 rounded border-2 bg-transparent ${borderClass} ${textClass}`}>
      {formatPersonalityScore(score)}
    </span>
  );
}

function getGroupAverageScore(group: GroupedTrait) {
  if (group.traits.length === 0) return 0;

  const totalPercentage = group.traits.reduce((sum, trait) => sum + trait.percentage, 0);
  return totalPercentage / group.traits.length;
}
