"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function getMobileFitScoreGradeColor(grade: string, isSelected: boolean) {
  if (isSelected) {
    switch (grade) {
      case "A":
        return "bg-blue-800 text-white border-blue-800";
      case "B":
        return "bg-blue-600 text-white border-blue-600";
      case "C":
        return "bg-blue-500 text-white border-blue-500";
      case "D":
        return "bg-blue-400 text-white border-blue-400";
      case "E":
        return "bg-blue-300 text-white border-blue-300";
      case "no-score":
      return "border-gray-600 bg-gray-600 text-white dark:border-gray-300 dark:bg-gray-300 dark:text-gray-950";
      default:
        return "bg-primary text-white border-primary";
    }
  }

  switch (grade) {
    case "A":
      return "bg-blue-800/10 text-blue-800 border-blue-800/30";
    case "B":
      return "bg-blue-600/10 text-blue-600 border-blue-600/30";
    case "C":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "D":
      return "bg-blue-400/10 text-blue-400 border-blue-400/30";
    case "E":
      return "bg-blue-300/10 text-blue-300 border-blue-300/30";
    case "no-score":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "bg-muted text-foreground border-border";
  }
}

function SmoothCount({ count }: { count: number }) {
  return (
    <span className="text-xs font-medium">
      {count >= 1000 ? (count / 1000).toFixed(1).replace(/\.0$/, "") + "k" : count.toString()}
    </span>
  );
}

interface MobileFitScoreFilterPillProps {
  count: number;
  isSelected: boolean;
  label: string;
  onClick?: () => void;
  toneClassName: string;
}

export function MobileFitScoreFilterPill({
  count,
  isSelected,
  label,
  onClick,
  toneClassName,
}: MobileFitScoreFilterPillProps) {
  return (
    <Button
      onClick={onClick}
      variant={isSelected ? "default" : "outline"}
      size="sm"
      className={cn(
        "flex-shrink-0 h-8 px-2 rounded-full text-xs font-medium transition-all border active:scale-95 touch-manipulation",
        toneClassName,
      )}
    >
      {label}
      <Badge
        variant="secondary"
        className={cn(
          "ml-1.5 text-[10px] px-1.5 py-0 h-4 min-w-[20px] flex items-center justify-center",
          isSelected ? "bg-white/20 text-white" : "bg-muted text-foreground",
        )}
      >
        <SmoothCount count={count} />
      </Badge>
    </Button>
  );
}
