"use client";

import { ChevronDownIcon as ChevronDown, ChevronRightIcon as ChevronRight } from "@heroicons/react/24/outline";

import { Card } from "@/components/ui/card";
import { getScoreColorInfo } from "@/components/ui/score-color";
import type { GroupedSkill } from "../types";

interface DetailedAnalysisSkillGroupCardProps {
  group: GroupedSkill;
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
}

export function DetailedAnalysisSkillGroupCard({
  group,
  isExpanded,
  toggleGroup,
}: DetailedAnalysisSkillGroupCardProps) {
  const avgScore = group.skills.reduce((sum, skill) => sum + skill.percentage, 0) / group.skills.length;
  const colorInfo = getScoreColorInfo(avgScore);

  return (
    <Card className="border border-border bg-card shadow-sm print:border-gray-200 print:bg-white">
      <button
        type="button"
        onClick={() => toggleGroup(group.groupId)}
        className="no-print flex min-h-11 w-full items-center justify-between rounded-t-lg p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          )}
          <div
            className="w-1 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: group.groupColor }}
          />
          <span className="truncate text-sm font-semibold text-foreground">
            {group.groupName}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className={`text-sm font-bold ${colorInfo.text}`}>
              {avgScore.toFixed(1)}%
            </p>
          </div>
          <div className="h-2 w-16 rounded-full bg-muted">
            <div
              className={`h-2 w-full origin-left rounded-full transition-transform ${colorInfo.bg.replace("bg-", "bg-").replace("text-", "")}`}
              style={{
                transform: `scaleX(${avgScore / 100})`,
                backgroundColor: group.groupColor,
              }}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-muted/35 print:block print:border-gray-200 print:bg-gray-50">
          <div className="p-2 space-y-1">
            {group.skills.map(skill => {
              const percentage = (skill.score / skill.maxScore) * 100;
              const skillColorInfo = getScoreColorInfo(percentage);

              return (
                <div
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50 print:border-gray-100 print:bg-white print:hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground print:text-gray-900">
                    {skill.name}
                  </span>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">{skill.score}/{skill.maxScore}</span>
                    <div className="h-2 w-20 rounded-full bg-muted print:bg-gray-200">
                      <div
                        className={`h-2 w-full origin-left rounded-full transition-transform ${skillColorInfo.bg}`}
                        style={{ transform: `scaleX(${percentage / 100})` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${skillColorInfo.bg} ${skillColorInfo.text} min-w-[60px] text-center`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
