"use client";

import {
  ChevronDownIcon as ChevronDown,
  ChevronRightIcon as ChevronRight,
} from "@heroicons/react/24/outline";

import { getScoreColorInfo } from "@/components/ui/score-color";
import {
  formatPersonalityScore,
  type GroupedSkill,
  type GroupedTrait,
} from "./applicant-evaluation-section-utils";

export function EvaluationSkillsBreakdown({
  expertiseGroups,
  personalityGroups,
  expandedGroups,
  onToggleGroup,
}: {
  expertiseGroups: GroupedSkill[];
  personalityGroups: GroupedTrait[];
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
}) {
  return (
    <>
      <h3 className="text-sm font-semibold mb-3">Skills Breakdown</h3>
      {expertiseGroups.length > 0 && (
        <ScoreGroupSection
          title="Expertise Skills"
          groups={expertiseGroups}
          expandedGroups={expandedGroups}
          onToggleGroup={onToggleGroup}
          renderItems={(group) => group.skills.map((skill) => (
            <ScorePill key={skill.id} name={skill.name} value={`${skill.percentage.toFixed(0)}%`} percentage={skill.percentage} />
          ))}
        />
      )}
      {personalityGroups.length > 0 && (
        <ScoreGroupSection
          title="Personality Traits"
          groups={personalityGroups}
          expandedGroups={expandedGroups}
          onToggleGroup={onToggleGroup}
          renderItems={(group) => group.traits.map((trait) => (
            <ScorePill key={trait.id} name={trait.name} value={formatPersonalityScore(trait.score)} percentage={trait.percentage} />
          ))}
        />
      )}
      {expertiseGroups.length === 0 && personalityGroups.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-8">
          No evaluation scores available
        </div>
      )}
    </>
  );
}

function ScoreGroupSection<TGroup extends GroupedSkill | GroupedTrait>({
  title,
  groups,
  expandedGroups,
  onToggleGroup,
  renderItems,
}: {
  title: string;
  groups: TGroup[];
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  renderItems: (group: TGroup) => React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">{title}</h4>
      <div className="space-y-1">
        {groups.map((group) => (
          <ScoreGroupRow
            key={group.groupId}
            group={group}
            isExpanded={expandedGroups.has(group.groupId)}
            onToggle={() => onToggleGroup(group.groupId)}
          >
            {renderItems(group)}
          </ScoreGroupRow>
        ))}
      </div>
    </div>
  );
}

function ScoreGroupRow({
  group,
  isExpanded,
  onToggle,
  children,
}: {
  group: GroupedSkill | GroupedTrait;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const items = "skills" in group ? group.skills : group.traits;
  const avgScore = items.reduce((sum, item) => sum + item.percentage, 0) / items.length;
  const colorInfo = getScoreColorInfo(avgScore);

  return (
    <div className="border rounded-md">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-xs font-medium truncate" style={{ color: group.groupColor }}>
            {group.groupName}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colorInfo.bg} ${colorInfo.text}`}>
            {avgScore.toFixed(1)}%
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t bg-muted/10 p-3">
          <div className="flex flex-wrap gap-2">{children}</div>
        </div>
      )}
    </div>
  );
}

function ScorePill({
  name,
  value,
  percentage,
}: {
  name: string;
  value: string;
  percentage: number;
}) {
  const colorInfo = getScoreColorInfo(percentage);

  return (
    <div className="inline-flex items-center bg-black text-white px-3 py-1.5 rounded-full text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
      <span>{name}</span>
      <span className="mx-1.5 opacity-30 text-[8px]">|</span>
      <span className={colorInfo.text.replace("text-", "text-")}>{value}</span>
    </div>
  );
}
