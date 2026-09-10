'use client';

import * as React from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import type { ExpensePolicyResult } from '@/lib/expenses/contracts';
import { HrisEmptyState, hrisStatusTone } from '@/components/hris/HrisWorkspacePrimitives';
import { cn } from '@/lib/utils';

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function ExpenseStatusBadge({ status }: { status: string }) {
  const pending = status.startsWith('pending_') || status.endsWith('_processing') || status === 'ready_for_review';
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
      hrisStatusTone(status),
    )}>
      {pending && <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />}
      {['approved', 'paid', 'posted', 'reconciled', 'closed', 'settled', 'fully_settled'].includes(status)
        && <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />}
      {['rejected', 'posting_failed', 'validation_failed'].includes(status)
        && <XCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />}
      {statusLabel(status)}
    </span>
  );
}

export function MoneyDisplay({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string | null;
  className?: string;
}) {
  if (!currency) {
    return <span className={cn('tabular-nums', className)}>{amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs font-medium text-slate-500">multi-currency</span></span>;
  }
  return (
    <span className={cn('tabular-nums', className)}>
      {new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
        minimumFractionDigits: 2,
      }).format(amount)}
    </span>
  );
}

const policyIcon = {
  passed: CheckCircleIcon,
  information: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  explanation_required: ExclamationTriangleIcon,
  additional_approval_required: ShieldCheckIcon,
  blocked: XCircleIcon,
};

export function PolicyWarningPanel({ results }: { results: ExpensePolicyResult[] }) {
  if (results.length === 0) {
    return (
      <div className="flex items-start gap-3 border-y border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <span>No policy issues are recorded for this request.</span>
      </div>
    );
  }
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {results.map((result, index) => {
        const Icon = policyIcon[result.level] || InformationCircleIcon;
        const blocked = result.level === 'blocked';
        return (
          <div
            key={`${result.code}-${index}`}
            className={cn(
              'flex items-start gap-3 px-4 py-3 text-sm',
              blocked
                ? 'bg-rose-50 text-rose-950 dark:bg-rose-950 dark:text-rose-100'
                : result.level === 'passed'
                  ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100'
                  : 'bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{result.title}</p>
              <p className="mt-0.5 opacity-80">{result.message}</p>
              {result.action && <p className="mt-1 font-medium">{result.action}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ExpenseSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-label="Loading expense records">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

export function ExpenseError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <XCircleIcon className="h-10 w-10 text-rose-500" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-slate-50">Expenses could not be loaded</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-slate-100 dark:text-slate-900"
      >
        <ArrowPathIcon className="h-4 w-4" />
        Try loading again
      </button>
    </div>
  );
}

export function ExpenseEmpty({
  resourceLabel,
  canCreate,
  onCreate,
}: {
  resourceLabel: string;
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-800">
      <HrisEmptyState
        icon={CheckCircleIcon}
        title={`No ${resourceLabel.toLowerCase()} in this view`}
        description="New records and requests that match the selected scope and filters will appear here."
        action={canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          Create {resourceLabel.toLowerCase()}
        </button>
        ) : undefined}
      />
    </div>
  );
}
