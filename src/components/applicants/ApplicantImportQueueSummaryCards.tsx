"use client";

import type { ComponentType, SVGProps } from 'react';
import {
  ArrowPathIcon as Loader2,
  CheckCircleIcon as CheckCircle,
  ClockIcon as Clock,
  ExclamationTriangleIcon as AlertTriangle,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface QueueSummary {
  total?: number;
  queued?: number;
  inprocess?: number;
  success?: number;
  error?: number;
}

interface SummaryCardConfig {
  title: string;
  value: number;
  iconColor: string;
  dotColor: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  animateIcon?: boolean;
}

interface ApplicantImportQueueSummaryCardsProps {
  summary?: QueueSummary;
}

export function ApplicantImportQueueSummaryCards({ summary }: ApplicantImportQueueSummaryCardsProps) {
  const cards: SummaryCardConfig[] = [
    {
      title: 'Waiting',
      value: summary?.queued ?? 0,
      iconColor: 'text-sky-600 dark:text-sky-400',
      dotColor: 'bg-sky-500',
      icon: Clock,
    },
    {
      title: 'In progress',
      value: summary?.inprocess ?? 0,
      iconColor: 'text-amber-600 dark:text-amber-400',
      dotColor: 'bg-amber-500',
      icon: Loader2,
      animateIcon: true,
    },
    {
      title: 'Ready to review',
      value: summary?.success ?? 0,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      icon: CheckCircle,
    },
    {
      title: 'Needs attention',
      value: summary?.error ?? 0,
      iconColor: 'text-rose-600 dark:text-rose-400',
      dotColor: 'bg-rose-500',
      icon: AlertTriangle,
    },
  ];

  const total = summary?.total ?? 0;
  const completed = summary?.success ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_1px_2px_hsl(var(--foreground)/.03)]">
      <div className="grid lg:grid-cols-[1.25fr_3fr]">
        <div className="border-b border-border/70 bg-muted/25 p-5 lg:border-b-0 lg:border-r lg:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Queue overview</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-[-0.04em] text-foreground">{total}</span>
            <span className="pb-1 text-sm text-muted-foreground">resumes in view</span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-border/70">
            <div className="h-full origin-left rounded-full bg-emerald-500 transition-transform duration-500" style={{ transform: `scaleX(${completionRate / 100})` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{completionRate}% converted into candidate profiles</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {cards.map((stat, index) => (
            <div key={stat.title} className={cn('relative p-4 sm:p-5', index > 0 && 'sm:border-l sm:border-border/60', index % 2 === 1 && 'border-l border-border/60', index > 1 && 'border-t border-border/60 sm:border-t-0')}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('h-2 w-2 rounded-full', stat.dotColor)} />
                <stat.icon aria-hidden="true" className={cn('h-4 w-4', stat.iconColor, stat.animateIcon && 'animate-spin')} />
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{stat.value}</div>
              <h3 className="mt-0.5 text-xs font-medium text-muted-foreground">{stat.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
