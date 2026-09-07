"use client";

import * as React from 'react';
import { CheckCircle2, ShieldCheck, Target, TrendingUp } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PerformanceStatusBadge } from './performance-ui';

export function ProfileField({ label, value, helper }: { label: string; value: React.ReactNode; helper: string }) {
  return <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><div className="mt-2 text-lg font-bold text-slate-950 dark:text-slate-50">{value}</div><p className="mt-1 text-xs text-slate-500">{helper}</p></div>;
}

export function ThemeList({ themes, tone }: { themes: string[]; tone: 'positive' | 'development' }) {
  return <ul className="space-y-3">{themes.map(theme => <li key={theme} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{tone === 'positive' ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> : <Target className="mt-1 h-4 w-4 shrink-0 text-amber-600" />}{theme}</li>)}</ul>;
}

export function CommentBlock({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50"><p className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{String(value || 'No comment recorded.')}</p></div>;
}

export function NotePreview({ label, value, privateNote = false }: { label: string; value: unknown; privateNote?: boolean }) {
  return <div className={`mt-3 rounded-lg p-3 ${privateNote ? 'bg-amber-50 dark:bg-amber-950/25' : 'bg-slate-50 dark:bg-slate-900/50'}`}><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{privateNote ? <ShieldCheck className="h-3.5 w-3.5" /> : null}{label}</p><p className="mt-1 line-clamp-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(value)}</p></div>;
}

export function FeedbackField({ label, value, positive = false }: { label: string; value: unknown; positive?: boolean }) {
  return <div className={`mt-3 rounded-lg p-3 ${positive ? 'bg-emerald-50 dark:bg-emerald-950/25' : 'bg-slate-50 dark:bg-slate-900/50'}`}><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{String(value)}</p></div>;
}

export function CompetencyMetric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'warning' | 'positive' }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p><p className={`mt-1 text-sm font-bold ${tone === 'warning' ? 'text-amber-700' : tone === 'positive' ? 'text-emerald-700' : 'text-slate-900 dark:text-slate-100'}`}>{value}</p></div>;
}

export function TeamMetric({ label, value, helper }: { label: string; value: React.ReactNode; helper: string }) {
  return <div className="bg-white p-4 dark:bg-slate-950"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-2 text-xl font-bold tabular-nums text-slate-950 dark:text-slate-50">{value}</p><p className="mt-1 text-xs text-slate-500">{helper}</p></div>;
}

export function EmployeeCell({ row }: { row: Record<string, unknown> }) {
  const name = String(row.name || 'Employee');
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return <div className="flex items-center gap-3"><Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">{row.profilePhotoUrl ? <AvatarImage src={String(row.profilePhotoUrl)} alt="" /> : null}<AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{initials}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-bold text-slate-950 dark:text-slate-50">{name}</p><p className="truncate text-xs text-slate-500">{String(row.jobTitle || row.employeeNumber || '')}</p></div></div>;
}

export function InlineProgress({ value, label }: { value: number; label?: string }) {
  return <div className="min-w-24"><div className="flex justify-between text-xs"><span className="text-slate-500">{label}</span><span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}%</span></div><Progress value={value} className="mt-2 h-1.5 bg-slate-100 [&>div]:bg-[#3459a8] dark:bg-slate-800" /></div>;
}

export function DrawerMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="mt-1 text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50">{value}</p></div>;
}

export function InsightGrid({ items, icon: Icon }: { items: Array<{ label: string; value: string | number; description: string }>; icon: typeof TrendingUp }) {
  return <div className="grid grid-cols-2 gap-3">{items.map(item => <article key={item.label} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50"><Icon className="h-4 w-4 text-[#3459a8] dark:text-blue-300" aria-hidden /><p className="mt-3 text-xl font-bold tabular-nums text-slate-950 dark:text-slate-50">{item.value}</p><p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{item.description}</p></article>)}</div>;
}

export function StatusDistribution({ team }: { team: Array<Record<string, unknown>> }) {
  const groups = ['on_track', 'attention_required', 'at_risk', 'review_not_started', 'completed']
    .map(status => ({ status, count: team.filter(item => item.performanceStatus === status).length }))
    .filter(item => item.count);
  const max = Math.max(...groups.map(item => item.count), 1);
  return <div className="space-y-4">{groups.map(item => <div key={item.status} className="grid grid-cols-[140px_minmax(0,1fr)_40px] items-center gap-3"><PerformanceStatusBadge status={item.status} /><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-[#3459a8]" style={{ width: `${(item.count / max) * 100}%` }} /></div><span className="text-right text-sm font-bold tabular-nums">{item.count}</span></div>)}</div>;
}

export function collectFeedbackThemes(feedback: Array<Record<string, unknown>>, field: 'wentWell' | 'improvementSuggestion') {
  return feedback.map(item => String(item[field] || '').trim()).filter(Boolean).slice(0, 5);
}

export function normalizeCompetencies(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([name, raw]) => {
    const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    return {
      name,
      category: String(item.category || 'core'),
      currentLevel: Number(item.currentLevel || item.managerRating || item.employeeRating || 0),
      expectedLevel: Number(item.expectedLevel || 0),
    };
  }).filter(item => item.currentLevel > 0 || item.expectedLevel > 0);
}

export function average(rows: Array<Record<string, unknown>>, field: string) {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, item) => sum + Number(item[field] || 0), 0) / rows.length);
}
