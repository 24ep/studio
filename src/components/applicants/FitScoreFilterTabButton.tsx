"use client";

import { cn } from '@/lib/utils';
import { FitScoreSmoothCount } from './FitScoreSmoothCount';

interface FitScoreFilterTabButtonProps {
  active: boolean;
  count: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'E' | 'no-score' | 'all';
  marker: string;
  onClick: () => void;
  range: string;
}

const gradeTileClasses = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  B: 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300',
  C: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  D: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  E: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  'no-score': 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300',
  all: 'bg-[#e2eaf5] text-[#315c92] dark:bg-blue-950 dark:text-blue-300',
} as const;

export function FitScoreFilterTabButton({
  active,
  count,
  grade = 'all',
  marker,
  onClick,
  range,
}: FitScoreFilterTabButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'group relative flex h-11 shrink-0 items-center gap-2.5 border-r border-[#dfe4eb] px-2.5 text-left transition-colors duration-150 last:border-r-0 dark:border-zinc-700',
        'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4c78ae]',
        active
          ? 'bg-[#183a63] text-[#f7f9fc] dark:bg-[#dce9f8] dark:text-[#142d4d]'
          : 'bg-white text-[#34445a] hover:bg-[#f2f5f8] dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid h-7 min-w-7 shrink-0 place-items-center rounded-[4px] px-1.5 text-[10px] font-extrabold tracking-[-0.01em]',
          gradeTileClasses[grade],
          active && 'bg-white/15 text-current dark:bg-[#17395f]/10',
        )}
      >
        {marker}
      </span>
      <span className="whitespace-nowrap text-[10px] font-medium leading-3.5">
        <span className="block text-[11px] font-bold">{range}</span>
        <span className={cn(active ? 'text-[#d7e4f2] dark:text-[#435c78]' : 'text-[#778397] dark:text-zinc-400')}>
          Fit score
        </span>
      </span>
      <span
        className={cn(
          'ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums transition-colors duration-150',
          active
            ? 'bg-white/15 text-white dark:bg-[#17395f]/10 dark:text-[#17395f]'
            : 'bg-[#edf0f4] text-[#637086] group-hover:bg-[#e1e7ee] dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700',
        )}
      >
        <FitScoreSmoothCount count={count} />
      </span>
    </button>
  );
}
