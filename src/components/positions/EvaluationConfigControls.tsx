"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { IconComponent } from "./EvaluationConfigTabTypes";

interface EvaluationConfigSubTabTriggerProps {
  active: boolean;
  icon: IconComponent;
  label: string;
  onSelect: () => void;
}

export function EvaluationConfigSubTabTrigger({
  active,
  icon: Icon,
  label,
  onSelect,
}: EvaluationConfigSubTabTriggerProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      role="tab"
      aria-selected={active}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

interface EvaluationSearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function EvaluationSearchInput({ placeholder, value, onChange }: EvaluationSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-10"
      />
    </div>
  );
}
