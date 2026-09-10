"use client";

import type { ComponentType, SVGProps } from "react";
import {
  ArrowTrendingUpIcon as TrendingUp,
  CircleStackIcon as Database,
  ClockIcon as Clock,
  ExclamationTriangleIcon as AlertTriangle,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface ProcessQueueOverviewStats {
  totalJobs: number;
  avgDuration: number;
  jobsByType: Array<{ type: string; count: number }>;
}

interface ProcessQueueOverviewCardsProps {
  stats: ProcessQueueOverviewStats;
}

interface OverviewCardDefinition {
  title: string;
  value: string | number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  marker: string;
}

function buildOverviewCards(stats: ProcessQueueOverviewStats): OverviewCardDefinition[] {
  return [
    {
      title: "Jobs processed",
      value: stats.totalJobs,
      icon: Database,
      color: "text-blue-500 dark:text-blue-400",
      marker: "bg-sky-500",
    },
    {
      title: "Average time",
      value: `${stats.avgDuration.toFixed(1)}m`,
      icon: Clock,
      color: "text-teal-500 dark:text-teal-400",
      marker: "bg-amber-500",
    },
    {
      title: "Ready profiles",
      value: stats.jobsByType.find((job) => job.type === "success")?.count || 0,
      icon: TrendingUp,
      color: "text-green-500 dark:text-green-400",
      marker: "bg-emerald-500",
    },
    {
      title: "Needs attention",
      value: stats.jobsByType.find((job) => job.type === "failed" || job.type === "error")?.count || 0,
      icon: AlertTriangle,
      color: "text-red-500 dark:text-red-400",
      marker: "bg-rose-500",
    },
  ];
}

export function ProcessQueueOverviewCards({ stats }: ProcessQueueOverviewCardsProps) {
  const cards = buildOverviewCards(stats);

  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_1px_2px_hsl(var(--foreground)/.03)] lg:grid-cols-4">
      {cards.map((stat, index) => (
        <div
          key={stat.title}
          className={cn(
            "relative flex items-center justify-between gap-4 p-4 sm:p-5",
            index % 2 === 1 && "border-l border-border/60",
            index > 1 && "border-t border-border/60 lg:border-t-0",
            index > 0 && "lg:border-l lg:border-border/60",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', stat.marker)} />
              <h3 className="truncate text-xs font-medium text-muted-foreground">{stat.title}</h3>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{stat.value}</div>
          </div>
          <stat.icon
            aria-hidden="true"
            className={cn("h-5 w-5 shrink-0", stat.color)}
          />
        </div>
      ))}
    </section>
  );
}
