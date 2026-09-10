"use client";

import * as React from 'react';
import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  LockKeyhole,
  MessageSquareText,
  MoreVertical,
  SlidersHorizontal,
  Target,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';
import { cn } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

type ActionName = 'check-in' | 'feedback' | 'recognition' | 'development' | 'evidence';
type FeedbackFilter = 'all' | 'received' | 'given' | 'requested' | 'recognition';
type InboxRow = {
  id: string;
  direction: Exclude<FeedbackFilter, 'all'>;
  source: string;
  sourceRole: string;
  initials: string;
  date: string;
  message: string;
  preview: string;
  visibility: string;
  contextLabel: string;
  contextValue: string;
  project?: string;
  unread?: boolean;
};

const themes = [
  { name: 'Communication', strengths: 18, growth: 6, emerging: 4, total: 28 },
  { name: 'Sales execution', strengths: 22, growth: 5, emerging: 2, total: 29 },
  { name: 'Strategic thinking', strengths: 9, growth: 18, emerging: 6, total: 33 },
  { name: 'Collaboration', strengths: 16, growth: 7, emerging: 3, total: 26 },
  { name: 'Executive presence', strengths: 8, growth: 11, emerging: 2, total: 21 },
];

const fallbackRows: InboxRow[] = [
  {
    id: 'feedback-ben',
    direction: 'received',
    source: 'Ben Thompson',
    sourceRole: 'Engineering Manager',
    initials: 'BT',
    date: 'Aug 12, 2026',
    preview: 'Leading the client rollout last week…',
    message: 'Great job leading the client rollout last week. Your preparation and clear communication kept the team aligned and the client confident. I also appreciated how you proactively documented the follow-ups—this will help us scale the approach for future rollouts.',
    visibility: 'Visible to employee only',
    contextLabel: 'Goal',
    contextValue: 'Improve client satisfaction score',
    project: 'Northwind Rollout',
    unread: true,
  },
  {
    id: 'feedback-krittaya',
    direction: 'given',
    source: 'Krittaya Sae',
    sourceRole: 'Customer Success Specialist',
    initials: 'KS',
    date: 'Aug 11, 2026',
    preview: 'Thanks for partnering closely on the Q2 launch.',
    message: 'Thanks for partnering closely on the Q2 launch. Your early escalation and steady follow-through made the handoff much easier for the customer success team.',
    visibility: 'Visible to employee only',
    contextLabel: 'Project',
    contextValue: 'Q2 product launch',
  },
  {
    id: 'feedback-arun',
    direction: 'received',
    source: 'Arun Sombat',
    sourceRole: 'Account Executive',
    initials: 'AS',
    date: 'Aug 9, 2026',
    preview: 'Your analysis helped us make a strong case.',
    message: 'Your analysis helped us make a strong case. You brought customer evidence into the conversation and gave the team a clear recommendation.',
    visibility: 'Visible to employee and manager',
    contextLabel: 'Competency',
    contextValue: 'Strategic thinking',
    unread: true,
  },
  {
    id: 'feedback-john',
    direction: 'requested',
    source: 'John Cooper',
    sourceRole: 'HR Manager',
    initials: 'JC',
    date: 'Aug 5, 2026',
    preview: 'You requested feedback on the new account plan.',
    message: 'Feedback requested on the new account plan and stakeholder communication approach.',
    visibility: 'Visible to employee only',
    contextLabel: 'Request',
    contextValue: 'Account planning feedback',
  },
  {
    id: 'recognition-daniel',
    direction: 'recognition',
    source: 'Daniel Wong',
    sourceRole: 'Software Engineer',
    initials: 'DW',
    date: 'Jul 30, 2026',
    preview: 'Recognized for Customer Focus.',
    message: 'Recognized for customer focus and calm ownership while resolving a high-priority client issue.',
    visibility: 'Visible to employee and manager',
    contextLabel: 'Company value',
    contextValue: 'Customer focus',
  },
];

export function PerformanceFeedbackGrowthCanvas({
  data,
  onAction,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
}) {
  const [screen, setScreen] = React.useState<'inbox' | 'analysis'>('inbox');

  if (screen === 'analysis') {
    return <FeedbackAnalysis data={data} onAction={onAction} onBack={() => setScreen('inbox')} />;
  }

  return <FeedbackInbox data={data} onAction={onAction} onOpenAnalysis={() => setScreen('analysis')} />;
}

function FeedbackInbox({
  data,
  onAction,
  onOpenAnalysis,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
  onOpenAnalysis: () => void;
}) {
  const rows = React.useMemo(() => buildInboxRows(data), [data]);
  const [filter, setFilter] = React.useState<FeedbackFilter>('all');
  const [selectedId, setSelectedId] = React.useState(rows[0]?.id || '');
  const visibleRows = filter === 'all' ? rows : rows.filter(row => row.direction === filter);
  const selected = visibleRows.find(row => row.id === selectedId) || visibleRows[0];

  React.useEffect(() => {
    if (!visibleRows.some(row => row.id === selectedId)) setSelectedId(visibleRows[0]?.id || '');
  }, [selectedId, visibleRows]);

  const stats = {
    received: rows.filter(row => row.direction === 'received').length,
    given: rows.filter(row => row.direction === 'given').length,
    requested: rows.filter(row => row.direction === 'requested').length,
    recognition: rows.filter(row => row.direction === 'recognition').length,
  };

  return (
    <section className="min-h-[710px] bg-background">
      <header className="flex flex-col gap-4 border-b border-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">Feedback inbox <MessageSquareText className="h-4 w-4 text-muted-foreground" aria-hidden /></h2>
          <p className="mt-1 text-xs text-muted-foreground">Feedback for {data.selectedEmployee?.name || 'the selected employee'} across the last 90 days.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onOpenAnalysis}><BarChart3 className="mr-2 h-4 w-4" />View feedback analysis</Button>
          <Button variant="outline" onClick={() => onAction('feedback')}>Request feedback</Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => onAction('feedback')}>Give feedback</Button>
        </div>
      </header>

      <div className="grid min-h-[630px] lg:grid-cols-[minmax(390px,510px)_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-5 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground">Last 90 days</p>
            <div className="mt-3 grid grid-cols-4 divide-x divide-border">
              <FeedbackStat label="Received" value={stats.received} />
              <FeedbackStat label="Given" value={stats.given} />
              <FeedbackStat label="Pending requests" value={stats.requested} />
              <FeedbackStat label="Recognition" value={stats.recognition} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5" aria-label="Feedback filters">
                {(['all', 'received', 'given', 'requested', 'recognition'] as const).map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={cn(
                      'min-h-8 border border-border px-2.5 text-[11px] font-semibold capitalize text-muted-foreground transition-colors hover:text-foreground',
                      filter === value && 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300',
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <button type="button" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground"><SlidersHorizontal className="h-3.5 w-3.5" />Newest</button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {visibleRows.map(row => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={cn(
                  'grid w-full grid-cols-[38px_minmax(0,1fr)_92px] gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40',
                  selected?.id === row.id && 'bg-blue-50 dark:bg-blue-950/25',
                )}
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-slate-100 text-[11px] font-semibold dark:bg-slate-800">{row.initials}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <DirectionLabel direction={row.direction} />
                    <strong className="truncate text-xs text-foreground">{row.source}</strong>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{row.preview}</span>
                  <span className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground"><LockKeyhole className="h-3 w-3" />{row.visibility}</span>
                </span>
                <span className="text-right text-[10px] text-muted-foreground">
                  {row.date}
                  {row.unread ? <span className="ml-auto mt-3 block h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" /> : null}
                </span>
              </button>
            ))}
            {!visibleRows.length ? <p className="px-5 py-12 text-center text-sm text-muted-foreground">No feedback matches this filter.</p> : null}
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>Showing {visibleRows.length} of {rows.length}</span>
            <button type="button" onClick={() => setFilter('all')} className="font-semibold text-blue-600 dark:text-blue-300">View all</button>
          </div>
        </div>

        <FeedbackReadingPane row={selected} onAction={onAction} />
      </div>
    </section>
  );
}

function FeedbackReadingPane({ row, onAction }: { row?: InboxRow; onAction: (action: ActionName) => void }) {
  if (!row) return <div className="grid min-h-[520px] place-items-center px-6 text-sm text-muted-foreground">Select feedback to read it.</div>;

  return (
    <article className="min-w-0 px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{row.direction === 'recognition' ? 'Recognition from' : row.direction === 'given' ? 'Feedback given to' : row.direction === 'requested' ? 'Feedback requested from' : 'Received from'}</p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border"><AvatarFallback className="bg-slate-100 text-xs font-semibold dark:bg-slate-800">{row.initials}</AvatarFallback></Avatar>
            <div><h3 className="text-sm font-semibold">{row.source}</h3><p className="mt-0.5 text-xs text-muted-foreground">{row.sourceRole}</p></div>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground"><p>{row.date}</p><p className="mt-2 flex items-center justify-end gap-1"><LockKeyhole className="h-3.5 w-3.5" />{row.visibility}</p></div>
      </div>

      <p className="mt-7 max-w-4xl text-base font-medium leading-7 text-foreground">{row.message}</p>

      <div className="mt-7 grid gap-6 border-y border-border py-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold">Context</p>
          <div className="mt-4 flex items-start gap-3"><Target className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{row.contextLabel}</p><p className="mt-1 text-sm font-medium">{row.contextValue}</p></div></div>
          {row.project ? <div className="mt-5 flex items-start gap-3"><MessageSquareText className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Project</p><p className="mt-1 text-sm font-medium">{row.project}</p></div></div> : null}
        </div>
        <div>
          <p className="text-xs font-semibold">About visibility</p>
          <p className="mt-4 max-w-sm text-xs leading-6 text-muted-foreground">This feedback follows its configured privacy policy. It will not appear in an appraisal or become visible to other people unless its visibility permits it.</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end"><Button variant="outline" onClick={() => onAction('check-in')}>Discuss in check-in</Button></div>
    </article>
  );
}

function FeedbackAnalysis({
  data,
  onAction,
  onBack,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
  onBack: () => void;
}) {
  const [selectedTheme, setSelectedTheme] = React.useState('Strategic thinking');
  const evidence = React.useMemo(() => buildInboxRows(data).filter(row => row.direction !== 'requested' && row.direction !== 'recognition').slice(0, 5), [data]);

  return (
    <section className="min-h-[710px] bg-background">
      <header className="flex flex-col gap-4 border-b border-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300"><ArrowLeft className="h-3.5 w-3.5" />Back to feedback inbox</button>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Feedback analysis</h2>
          <p className="mt-1 text-xs text-muted-foreground">Themes and evidence for {data.selectedEmployee?.name || 'the selected employee'} across the last 90 days.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onAction('feedback')}>Request feedback</Button><Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => onAction('feedback')}>Give feedback</Button></div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r">
          <div><h3 className="text-sm font-semibold">Feedback themes overview</h3><p className="mt-1 text-xs text-muted-foreground">Based on feedback received in the selected period.</p></div>
          <div className="mt-4 overflow-x-auto border-y border-border">
            <div className="grid min-w-[720px] grid-cols-[150px_repeat(3,minmax(110px,1fr))_70px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground"><span>Theme</span><span className="text-emerald-500">Strengths</span><span className="text-amber-500">Growth opportunities</span><span className="text-blue-500">Emerging themes</span><span>Total</span></div>
            {themes.map(theme => (
              <button key={theme.name} type="button" onClick={() => setSelectedTheme(theme.name)} className={cn('grid min-w-[720px] w-full grid-cols-[150px_repeat(3,minmax(110px,1fr))_70px] items-center border-t border-border px-3 py-2 text-left text-xs', selectedTheme === theme.name ? 'bg-blue-50 dark:bg-blue-950/35' : 'hover:bg-slate-50 dark:hover:bg-slate-900/40')}>
                <span className="font-semibold">{theme.name}</span><ThemeBar value={theme.strengths} tone="green" /><ThemeBar value={theme.growth} tone="amber" /><ThemeBar value={theme.emerging} tone="blue" /><strong>{theme.total}</strong>
              </button>
            ))}
          </div>

          <div className="mt-5"><h3 className="text-sm font-semibold">Feedback evidence (chronological)</h3>
            <div className="mt-3 overflow-x-auto border-y border-border">
              <div className="grid min-w-[850px] grid-cols-[85px_150px_75px_minmax(240px,1fr)_140px_130px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground"><span>Date</span><span>Source</span><span>Type</span><span>Feedback</span><span>Linked to</span><span>Visibility</span></div>
              {evidence.map(row => <div key={row.id} className="grid min-w-[850px] grid-cols-[85px_150px_75px_minmax(240px,1fr)_140px_130px] items-center border-t border-border px-3 py-3 text-[11px]"><span>{row.date}</span><span className="flex min-w-0 items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="bg-slate-100 text-[9px] dark:bg-slate-800">{row.initials}</AvatarFallback></Avatar><span className="min-w-0"><strong className="block truncate text-xs">{row.source}</strong><span className="block truncate text-[10px] text-muted-foreground">{row.sourceRole}</span></span></span><span className="capitalize">{row.direction}</span><span className="pr-3 leading-4">{row.message}</span><span className="text-blue-600 dark:text-blue-300">{row.contextValue}</span><span className="text-muted-foreground">{row.visibility}</span></div>)}
            </div>
          </div>
        </main>

        <aside className="px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-blue-600 dark:text-blue-300">Feedback focus</p>
          <div className="mt-4 flex flex-wrap items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-500" /><h3 className="text-lg font-semibold">{selectedTheme}</h3><span className="border border-amber-300 bg-amber-50 px-2 py-1 text-[9px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Growth opportunity</span></div>
          <p className="mt-5 text-xs font-semibold">Trend over last 90 days</p>
          <div className="mt-3 h-36 border-y border-border py-3"><TrendLineChart /></div>
          <div className="mt-5 flex items-center justify-between"><p className="text-xs font-semibold">Supporting feedback ({Math.min(4, evidence.length)})</p><button type="button" className="text-xs text-blue-600 dark:text-blue-300">View all</button></div>
          <div className="mt-3 divide-y divide-border border-y border-border">{evidence.slice(0, 4).map(row => <div key={row.id} className="py-3"><p className="text-xs leading-5">“{row.message}”</p><p className="mt-1 text-[10px] text-muted-foreground">{row.source} · {row.sourceRole} · {row.date}</p></div>)}</div>
          <div className="mt-5"><p className="text-xs font-semibold">Manager coaching prompt</p><p className="mt-2 text-xs leading-5 text-muted-foreground">How can {data.selectedEmployee?.name || 'this employee'} apply {selectedTheme.toLowerCase()} earlier and connect ideas to measurable outcomes?</p></div>
          <div className="mt-5 grid gap-2"><Button variant="outline" size="sm" onClick={() => toast.success('Added to next check-in')}>Add to check-in</Button><Button variant="outline" size="sm" onClick={() => onAction('development')}>Add development action</Button><Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => onAction('feedback')}>Give feedback</Button></div>
        </aside>
      </div>
    </section>
  );
}

function FeedbackStat({ label, value }: { label: string; value: number }) {
  return <div className="px-2 text-center first:pl-0 last:pr-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-base font-semibold tabular-nums">{value}</p></div>;
}

function DirectionLabel({ direction }: { direction: InboxRow['direction'] }) {
  const styles = direction === 'received' ? 'text-blue-600 dark:text-blue-300' : direction === 'given' ? 'text-emerald-600 dark:text-emerald-300' : direction === 'requested' ? 'text-violet-600 dark:text-violet-300' : 'text-amber-600 dark:text-amber-300';
  const Icon = direction === 'recognition' ? Award : direction === 'given' ? ArrowRight : direction === 'received' ? ArrowLeft : MessageSquareText;
  return <span className={cn('inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold capitalize', styles)}><Icon className="h-3 w-3" />{direction}</span>;
}

function ThemeBar({ value, tone }: { value: number; tone: 'green' | 'amber' | 'blue' }) {
  return <span className="flex items-center gap-2"><span className="h-1.5 w-20 bg-slate-200 dark:bg-slate-800"><span className={cn('block h-full', tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500')} style={{ width: `${Math.min(100, value * 4)}%` }} /></span><strong>{value}</strong></span>;
}

function TrendLineChart() {
  return (
    <Line
      data={{
        labels: ['May 15', 'Jun 5', 'Jun 26', 'Jul 17', 'Aug 7'],
        datasets: [{ data: [5, 9, 14, 19, 25], borderColor: '#f59e0b', backgroundColor: '#f59e0b', pointRadius: 3, pointHoverRadius: 4, borderWidth: 2, tension: 0.25 }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { displayColors: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 }, maxRotation: 0 } },
          y: { beginAtZero: true, suggestedMax: 30, grid: { color: 'rgba(100,116,139,.18)' }, ticks: { color: '#64748b', font: { size: 9 }, stepSize: 10 } },
        },
      }}
    />
  );
}

function buildInboxRows(data: PerformanceWorkspaceData): InboxRow[] {
  const feedbackRows = data.feedback.map((row, index): InboxRow => {
    const fallback = fallbackRows[index % fallbackRows.length];
    const status = String(row.status || '').toLowerCase();
    const direction: InboxRow['direction'] = status === 'requested' ? 'requested' : String(row.providerId || '') === data.selectedEmployee?.id ? 'given' : 'received';
    const source = String(row.providerName || row.requestedProviderName || fallback.source);
    return {
      id: String(row.id || fallback.id),
      direction,
      source,
      sourceRole: String(row.providerJobTitle || row.jobTitle || fallback.sourceRole),
      initials: initials(source),
      date: formatDate(row.createdAt || fallback.date),
      preview: String(row.context || row.wentWell || row.improvementSuggestion || fallback.preview),
      message: String(row.wentWell || row.improvementSuggestion || row.recommendedAction || row.context || fallback.message),
      visibility: visibilityLabel(row.visibility || fallback.visibility),
      contextLabel: row.relatedCompetency ? 'Competency' : row.relatedProject ? 'Project' : fallback.contextLabel,
      contextValue: String(row.relatedCompetency || row.relatedProject || row.context || fallback.contextValue),
      project: row.relatedProject ? String(row.relatedProject) : fallback.project,
      unread: !row.acknowledgedAt && direction === 'received',
    };
  });
  const recognitionRows = data.recognition.map((row, index): InboxRow => {
    const fallback = fallbackRows.find(item => item.direction === 'recognition') || fallbackRows[0];
    const source = String(row.providerName || row.recognizerName || fallback.source);
    return {
      id: String(row.id || `recognition-${index}`),
      direction: 'recognition',
      source,
      sourceRole: String(row.providerJobTitle || row.jobTitle || fallback.sourceRole),
      initials: initials(source),
      date: formatDate(row.createdAt || fallback.date),
      preview: String(row.message || fallback.preview),
      message: String(row.message || fallback.message),
      visibility: visibilityLabel(row.visibility || fallback.visibility),
      contextLabel: 'Company value',
      contextValue: String(row.companyValue || row.category || fallback.contextValue).replace(/_/g, ' '),
      project: row.relatedProject ? String(row.relatedProject) : undefined,
    };
  });
  return feedbackRows.length || recognitionRows.length ? [...feedbackRows, ...recognitionRows] : fallbackRows;
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'FB';
}

function visibilityLabel(value: unknown) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('manager') && normalized.includes('employee')) return 'Visible to employee and manager';
  if (normalized.includes('manager')) return 'Visible to manager only';
  if (normalized.includes('organization') || normalized.includes('public')) return 'Visible to organization';
  return 'Visible to employee only';
}

function formatDate(value: unknown) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value || '') : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
