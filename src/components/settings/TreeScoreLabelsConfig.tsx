"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { TreeScoreLabels } from "./tree-view-utils";

const SCORE_LABEL_KEYS = ["1", "2", "3", "4", "5"] as const;

interface TreeScoreLabelsConfigProps {
  idPrefix: string;
  labels: TreeScoreLabels;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLabelsChange: (labels: TreeScoreLabels) => void;
}

export function TreeScoreLabelsConfig({
  idPrefix,
  labels,
  open,
  onOpenChange,
  onLabelsChange,
}: TreeScoreLabelsConfigProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between">
          <span>Advanced Configuration</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "transform rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        <div>
          <Label>Score Labels (1-5)</Label>
          <div className="space-y-3">
            {SCORE_LABEL_KEYS.map((score) => (
              <div key={score} className="flex items-center gap-3">
                <Label htmlFor={`${idPrefix}-score-${score}`} className="w-8 text-sm">
                  {score}:
                </Label>
                <Input
                  id={`${idPrefix}-score-${score}`}
                  value={labels[score]}
                  onChange={(event) => onLabelsChange({
                    ...labels,
                    [score]: event.target.value,
                  })}
                  placeholder={`Label for score ${score}`}
                />
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
