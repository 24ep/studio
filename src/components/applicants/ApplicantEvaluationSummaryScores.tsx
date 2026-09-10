"use client";

import { DocumentTextIcon as FileText, UsersIcon as Users } from "@heroicons/react/24/outline";

import { getScoreColorInfo } from "@/components/ui/score-color";

export function EvaluationSummaryScores({
  expertiseAvg,
  personalityAvg,
}: {
  expertiseAvg: number;
  personalityAvg: number;
}) {
  return (
    <div className="mb-6 flex-shrink-0">
      <h3 className="text-sm font-semibold mb-3">Summary Scores</h3>
      <div className="grid grid-cols-2 gap-4">
        <SummaryScoreCard
          icon={<FileText className="w-4 h-4 text-muted-foreground" />}
          label="Expertise Skills"
          score={expertiseAvg}
        />
        <SummaryScoreCard
          icon={<Users className="w-4 h-4 text-muted-foreground" />}
          label="Personality Traits"
          score={personalityAvg}
        />
      </div>
    </div>
  );
}

function SummaryScoreCard({
  icon,
  label,
  score,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
}) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{score.toFixed(1)}%</span>
        <div className="w-16 h-2 rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${getScoreColorInfo(score).bg}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
