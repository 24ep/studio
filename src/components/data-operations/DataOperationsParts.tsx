'use client';

import * as React from 'react';
import {
  ArrowDownToLine,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  FileSpreadsheet,
  History,
  Loader2,
  Search,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

import ApplicantImportUploadQueue from '@/components/applicants/ApplicantImportUploadQueue';
import ProcessQueueAnalytics from '@/components/applicants/ProcessQueueAnalytics';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DataOperationQueue } from './DataOperationQueue';
import {
  DATA_OPERATION_MODELS,
  DATA_TRANSFER_DOMAIN_OPTIONS,
  getSystemTransferDomainLabel,
  type DataTransferDomain,
  type DataOperationModel,
  type DataOperationModelId,
  type ExportFormat,
  type ImportResult,
} from './data-operations-api';
import {
  ALL_TRANSFER_DOMAIN_IDS,
  EMPTY_FILTERS,
  formatBytes,
  getRecordsLabel,
  type ApplicantExportFilters,
} from './DataOperationsModel';

export type ActivityView = 'data' | 'cv' | 'analytics';

export function StepRail({ current, mode }: { current: number; mode: 'import' | 'export' }) {
  const labels = ['Choose data', mode === 'import' ? 'Upload file' : 'Configure export', 'Review & run'];
  return (
    <ol className="grid grid-cols-3" aria-label={`${mode} progress`}>
      {labels.map((label, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;
        return (
          <li key={label} className="relative flex items-center gap-2 after:absolute after:left-[calc(50%+1.25rem)] after:right-[calc(-50%+1.25rem)] after:top-4 after:h-px after:bg-border last:after:hidden">
            <span className={cn('relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-background text-xs font-semibold text-muted-foreground', active && 'border-primary bg-primary text-primary-foreground', complete && 'border-primary bg-primary/10 text-primary')}>
              {complete ? <Check className="h-4 w-4" /> : number}
            </span>
            <span className={cn('hidden text-sm font-medium sm:block', !active && 'text-muted-foreground')}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function ChooseDataStep({ selected, onSelect }: { selected: DataOperationModelId; onSelect: (id: DataOperationModelId) => void }) {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | null)?.role;
  const models = DATA_OPERATION_MODELS.filter(model => model.id === 'applicants' || model.id === 'positions' || userRole === 'Admin');
  return (
    <StepContent eyebrow="Step 1" title="What data are you moving?" description="Only production-backed data types are shown here.">
      <div className="grid gap-3 sm:grid-cols-2">
        {models.map(model => {
          const Icon = model.id === 'applicants' ? Users : model.id === 'positions' ? BriefcaseBusiness : Database;
          const active = selected === model.id;
          return (
            <button key={model.id} type="button" onClick={() => onSelect(model.id)} aria-pressed={active} className={cn('group flex min-h-28 flex-col items-start rounded-xl border p-4 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active && 'border-primary bg-primary/[.04] ring-1 ring-primary/20')}>
              <span className={cn('grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground', active && 'bg-primary/10 text-primary')}><Icon className="h-4 w-4" /></span>
              <span className="mt-3 flex w-full items-center justify-between gap-3"><span className="font-semibold">{model.name}</span>{active && <CheckCircle2 className="h-4.5 w-4.5 text-primary" />}</span>
              <span className="mt-1 text-sm leading-5 text-muted-foreground">{model.description}</span>
              <span className="mt-2 text-xs font-medium text-muted-foreground">Import {model.importTypesLabel} · Export {model.exportFormatsLabel}</span>
            </button>
          );
        })}
      </div>
    </StepContent>
  );
}

export function ImportConfigureStep({ model, file, isDownloading, onDownload, onFile }: { model: DataOperationModel; file: File | null; isDownloading: boolean; onDownload: () => void; onFile: (file: File | null) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const isSystemTransfer = model.id === 'system-transfer' || Boolean(model.systemTransferDomain);
  return (
    <StepContent eyebrow="Step 2" title={`Prepare your ${model.name.toLowerCase()} file`} description="Start from the template so headers and values match the importer.">
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-muted/35 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3"><FileSpreadsheet className="h-8 w-8 text-emerald-600" /><div><p className="text-sm font-medium">{model.name} import template</p><p className="text-xs text-muted-foreground">{model.templateHelp}</p></div></div>
        <Button variant="outline" size="sm" onClick={onDownload} disabled={isDownloading || isSystemTransfer}>
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownToLine className="mr-2 h-4 w-4" />}{isSystemTransfer ? 'Export to create package' : 'Download template'}
        </Button>
      </div>
      <div className="mt-5">
        <Label>Completed file</Label>
        <div
          onDragEnter={event => { event.preventDefault(); setDragging(true); }}
          onDragOver={event => event.preventDefault()}
          onDragLeave={event => { event.preventDefault(); if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
          onDrop={event => { event.preventDefault(); setDragging(false); onFile(event.dataTransfer.files?.[0] ?? null); }}
          className={cn('mt-2 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/15 px-6 text-center transition-colors', dragging && 'border-primary bg-primary/[.04]', file && 'border-emerald-500/40 bg-emerald-500/[.04]')}
        >
          <input ref={inputRef} type="file" accept={model.accept} className="sr-only" onChange={event => onFile(event.target.files?.[0] ?? null)} />
          {file ? (
            <><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><Check className="h-5 w-5" /></span><p className="mt-3 max-w-full truncate text-sm font-medium">{file.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(file.size)} · ready to review</p><Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => { onFile(null); if (inputRef.current) inputRef.current.value = ''; }}><X className="mr-2 h-3.5 w-3.5" /> Remove</Button></>
          ) : (
            <><span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><UploadCloud className="h-5 w-5" /></span><p className="mt-3 text-sm font-medium">Drop your file here</p><p className="mt-1 text-xs text-muted-foreground">{model.uploadHelp}</p><Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => inputRef.current?.click()}>Browse files</Button></>
          )}
        </div>
      </div>
    </StepContent>
  );
}

export function ExportConfigureStep({ model, format, filters, onFormat, onFilters }: { model: DataOperationModel; format: ExportFormat; filters: ApplicantExportFilters; onFormat: (value: ExportFormat) => void; onFilters: (value: ApplicantExportFilters) => void }) {
  const isSystemTransfer = model.id === 'system-transfer' || Boolean(model.systemTransferDomain);
  const update = (key: keyof ApplicantExportFilters, value: string) => onFilters({ ...filters, [key]: value });
  const description = model.id === 'applicants'
    ? 'Narrow the export when needed. Blank filters include every applicant you can access.'
    : model.id === 'positions'
      ? 'The positions exporter includes all position fields and records.'
      : model.systemTransferDomain
        ? 'This export is scoped to one data model domain so that migration packages stay lightweight.'
        : 'Choose the business domains to include in the validated JSONL transfer package.';
  return (
    <StepContent eyebrow="Step 2" title="Configure the export" description={description}>
      <div className="max-w-sm"><Label>File format</Label><Select value={format} onValueChange={value => onFormat(value as ExportFormat)} disabled={model.id !== 'applicants'}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{isSystemTransfer ? <SelectItem value="jsonl">HRI transfer package (.jsonl)</SelectItem> : <SelectItem value="excel">Excel workbook (.xlsx)</SelectItem>}{model.id === 'applicants' && <SelectItem value="csv">CSV file (.csv)</SelectItem>}</SelectContent></Select></div>
      {model.id === 'applicants' ? (
        <div className="mt-6 border-t pt-5">
          <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Optional filters</h3><p className="mt-0.5 text-xs text-muted-foreground">All filled filters are applied together.</p></div><Button variant="ghost" size="sm" onClick={() => onFilters(EMPTY_FILTERS)}>Clear</Button></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name contains"><Input value={filters.name} onChange={event => update('name', event.target.value)} placeholder="e.g. Anan" /></Field>
            <Field label="Email contains"><Input type="email" value={filters.email} onChange={event => update('email', event.target.value)} placeholder="e.g. @company.com" /></Field>
            <Field label="Applied from"><Input type="date" value={filters.applicationDateStart} onChange={event => update('applicationDateStart', event.target.value)} /></Field>
            <Field label="Applied through"><Input type="date" value={filters.applicationDateEnd} min={filters.applicationDateStart || undefined} onChange={event => update('applicationDateEnd', event.target.value)} /></Field>
            <Field label="Minimum fit score"><Input type="number" min="0" max="100" value={filters.minAppliedJobFitScore} onChange={event => update('minAppliedJobFitScore', event.target.value)} placeholder="0–100" /></Field>
          </div>
        </div>
      ) : model.systemTransferDomain ? <TransferDomainNotice domain={model.systemTransferDomain} /> : <TransferDomainSelector value={filters.transferDomains} onChange={transferDomains => onFilters({ ...filters, transferDomains })} />}
    </StepContent>
  );
}

export function ReviewStep({ mode, model, file, format, filters, result }: { mode: 'import' | 'export'; model: DataOperationModel; file: File | null; format: ExportFormat; filters: ApplicantExportFilters; result: ImportResult | null }) {
  if (result) return <StepContent eyebrow="Queued" title={`${mode === 'import' ? 'Import' : 'Export'} submitted`} description={result.summary}><div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="text-sm font-medium">Job #{result.jobId.slice(0, 8)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The operation will run when capacity is available. Open Data job queue to follow progress, see who requested it, review results, or download a completed export.</p></div></div></StepContent>;
  return (
    <StepContent eyebrow="Step 3" title={`Review your ${mode}`} description="Nothing runs until you confirm below.">
      <div className="divide-y rounded-lg border"><ReviewRow label="Data" value={model.name} />{mode === 'import' ? <><ReviewRow label="File" value={file?.name ?? 'No file selected'} /><ReviewRow label="File size" value={file ? formatBytes(file.size) : '—'} /><ReviewRow label="Behavior" value={model.importBehavior} /></> : <><ReviewRow label="Format" value={format === 'excel' ? 'Excel workbook (.xlsx)' : format === 'jsonl' ? 'HRI transfer package (.jsonl)' : 'CSV file (.csv)'} /><ReviewRow label="Records" value={getRecordsLabel(model, filters)} /></>}</div>
      <div className="mt-5 flex items-start gap-3 rounded-lg bg-primary/[.05] p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-medium">Ready to add to queue</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{mode === 'import' ? model.reviewHelp : 'The export will be generated asynchronously. Download it from the data job queue when it is ready.'}</p></div></div>
    </StepContent>
  );
}

export function FlowSummary({ mode, step, model, file, format, filters }: { mode: 'import' | 'export'; step: number; model: DataOperationModel; file: File | null; format: ExportFormat; filters: ApplicantExportFilters }) {
  return <aside className="h-fit rounded-xl border bg-background p-5 lg:sticky lg:top-4"><p className="text-sm font-semibold">Current operation</p><div className="mt-4 space-y-3 text-sm"><ReviewRow compact label="Action" value={mode === 'import' ? 'Import' : 'Export'} /><ReviewRow compact label="Data" value={model.name} /><ReviewRow compact label="Progress" value={`Step ${step} of 3`} />{mode === 'import' ? <ReviewRow compact label="File" value={file ? file.name : 'Not selected'} /> : <><ReviewRow compact label="Format" value={format.toUpperCase()} /><ReviewRow compact label={model.systemTransferDomain || model.id === 'system-transfer' ? 'Selection' : 'Scope'} value={getRecordsLabel(model, filters)} /></>}</div><p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">Confirming creates a queued job. Processing never runs inside the submission request, and every affected record is audit logged.</p></aside>;
}

function TransferDomainNotice({ domain }: { domain: DataTransferDomain }) {
  return <div className="mt-6 rounded-lg border bg-muted/25 p-4 text-sm"><h3 className="text-sm font-semibold">Transfer scope</h3><p className="mt-1 text-xs text-muted-foreground">This export is scoped to {getSystemTransferDomainLabel(domain)}.</p></div>;
}

function TransferDomainSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = new Set(value.split(',').filter(Boolean));
  const toggle = (domain: string) => { const next = new Set(selected); if (next.has(domain)) next.delete(domain); else next.add(domain); onChange(ALL_TRANSFER_DOMAIN_IDS.filter(id => next.has(id)).join(',')); };
  return <div className="mt-6 border-t pt-5"><div><h3 className="text-sm font-semibold">Business domains</h3><p className="mt-1 text-xs text-muted-foreground">Sensitive authentication, security, audit, notification, and operational records are always excluded.</p></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{DATA_TRANSFER_DOMAIN_OPTIONS.map(domain => <label key={domain.id} className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"><input type="checkbox" checked={selected.has(domain.id)} onChange={() => toggle(domain.id)} className="h-4 w-4 rounded border-input accent-primary" /><span>{domain.label}</span></label>)}</div>{selected.size === 0 && <p className="mt-2 text-xs font-medium text-destructive">Select at least one domain.</p>}</div>;
}

export function ActivityPanel({ view, onViewChange }: { view: ActivityView; onViewChange: (view: ActivityView) => void }) {
  return <div><div className="mb-4 flex flex-wrap items-center gap-2"><Button variant={view === 'data' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('data')}><Database className="mr-2 h-4 w-4" /> Data job queue</Button><Button variant={view === 'cv' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('cv')}><History className="mr-2 h-4 w-4" /> CV processing</Button><Button variant={view === 'analytics' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('analytics')}><Search className="mr-2 h-4 w-4" /> Analytics</Button></div>{view === 'data' ? <DataOperationQueue /> : view === 'cv' ? <ApplicantImportUploadQueue /> : <ErrorBoundary><ProcessQueueAnalytics /></ErrorBoundary>}</div>;
}

function StepContent({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section><div className="border-b px-5 py-5 sm:px-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><div className="p-5 sm:p-6">{children}</div></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}

function ReviewRow({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return <div className={cn('flex items-start justify-between gap-4', compact ? 'border-b pb-3 last:border-0 last:pb-0' : 'px-4 py-3')}><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] truncate text-right font-medium" title={value}>{value}</span></div>;
}
