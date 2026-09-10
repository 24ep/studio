"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  Bars3Icon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type AdminRecord = Record<string, unknown> & { id: string };
type ApiResponse = { resource?: { records?: AdminRecord[] }; records?: AdminRecord[]; data?: AdminRecord; message?: string };
type PhaseId = 'before_start' | 'first_week' | 'first_30_days';
type TaskDraft = {
  title: string;
  description: string;
  detailedInstructions: string;
  ownerRole: string;
  dueDay: string;
  isRequired: boolean;
  employeeVisibility: string;
  tags: string;
};

const PHASES: Array<{ id: PhaseId; label: string; defaultDueDay: number }> = [
  { id: 'before_start', label: 'Before start', defaultDueDay: -1 },
  { id: 'first_week', label: 'First week', defaultDueDay: 3 },
  { id: 'first_30_days', label: 'First 30 days', defaultDueDay: 14 },
];

const EMPTY_DRAFT: TaskDraft = {
  title: '',
  description: '',
  detailedInstructions: '',
  ownerRole: 'employee',
  dueDay: '0',
  isRequired: true,
  employeeVisibility: 'visible',
  tags: '',
};

function records(payload: ApiResponse) { return payload.resource?.records || payload.records || []; }
function value(record: AdminRecord, camel: string, snake?: string) { return record[camel] ?? (snake ? record[snake] : undefined); }
function asBoolean(input: unknown, fallback = false) { return input === undefined || input === null ? fallback : input === true || input === 'true'; }
function taskPhase(task: AdminRecord): PhaseId {
  const dueDay = Number(value(task, 'dueDay', 'due_day') || 0);
  return dueDay <= 0 ? 'before_start' : dueDay <= 7 ? 'first_week' : 'first_30_days';
}
function phaseLabel(task: AdminRecord) {
  const dueDay = Number(value(task, 'dueDay', 'due_day') || 0);
  if (dueDay < 0) return `${Math.abs(dueDay)} day${Math.abs(dueDay) === 1 ? '' : 's'} before start`;
  if (dueDay === 0) return 'Start date';
  return `Within ${dueDay} day${dueDay === 1 ? '' : 's'} of start`;
}
function taskDraft(task: AdminRecord): TaskDraft {
  const tags = value(task, 'tags');
  return {
    title: String(task.title || ''),
    description: String(task.description || ''),
    detailedInstructions: String(value(task, 'detailedInstructions', 'detailed_instructions') || ''),
    ownerRole: String(value(task, 'ownerRole', 'owner_role') || 'employee'),
    dueDay: String(value(task, 'dueDay', 'due_day') ?? 0),
    isRequired: asBoolean(value(task, 'isRequired', 'is_required'), true),
    employeeVisibility: String(value(task, 'employeeVisibility', 'employee_visibility') || 'visible'),
    tags: Array.isArray(tags) ? tags.join(', ') : '',
  };
}

export function OnboardingChecklistAdminClient({ embedded = false }: { embedded?: boolean }) {
  const [templates, setTemplates] = React.useState<AdminRecord[]>([]);
  const [tasks, setTasks] = React.useState<AdminRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<TaskDraft>(EMPTY_DRAFT);
  const [newTemplateName, setNewTemplateName] = React.useState('');
  const [showNewTemplate, setShowNewTemplate] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [bulkPhase, setBulkPhase] = React.useState<PhaseId>('first_week');
  const [draggingTaskId, setDraggingTaskId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [templatesResponse, tasksResponse] = await Promise.all([
        fetch('/api/hr/onboarding?view=templates', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/hr/onboarding?view=tasks', { credentials: 'include', cache: 'no-store' }),
      ]);
      if (!templatesResponse.ok || !tasksResponse.ok) throw new Error('Unable to load onboarding checklist configuration.');
      const [templatesPayload, tasksPayload] = await Promise.all([templatesResponse.json() as Promise<ApiResponse>, tasksResponse.json() as Promise<ApiResponse>]);
      const nextTemplates = records(templatesPayload);
      setTemplates(nextTemplates);
      setTasks(records(tasksPayload));
      setSelectedTemplateId(current => current && nextTemplates.some(item => item.id === current) ? current : nextTemplates[0]?.id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load onboarding checklist configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => { setSelectedTaskIds(new Set()); setEditingTaskId(null); }, [selectedTemplateId]);

  const selectedTemplate = templates.find(template => template.id === selectedTemplateId) || null;
  const templateTasks = React.useMemo(() => tasks
    .filter(task => value(task, 'templateId', 'template_id') === selectedTemplateId)
    .sort((a, b) => Number(value(a, 'sortOrder', 'sort_order') || 0) - Number(value(b, 'sortOrder', 'sort_order') || 0)), [selectedTemplateId, tasks]);
  const filteredTasks = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? templateTasks.filter(task => `${String(task.title || '')} ${String(task.description || '')} ${String(value(task, 'ownerRole', 'owner_role') || '')}`.toLowerCase().includes(search)) : templateTasks;
  }, [query, templateTasks]);

  async function mutation(url: string, init: RequestInit, fallback: string) {
    const response = await fetch(url, { credentials: 'include', ...init });
    const payload = await response.json().catch(() => ({})) as ApiResponse;
    if (!response.ok) throw new Error(payload.message || fallback);
    return payload.data || null;
  }

  async function createTemplate() {
    if (!newTemplateName.trim()) return;
    setIsSaving(true); setError(null);
    try {
      const created = await mutation('/api/hr/onboarding?view=templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTemplateName.trim(), description: 'Reusable employee onboarding checklist', isActive: 'false' }) }, 'Unable to create onboarding template.');
      if (created?.id) setSelectedTemplateId(created.id);
      setNewTemplateName(''); setShowNewTemplate(false); setNotice('Template created as a draft.');
      await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to create onboarding template.'); }
    finally { setIsSaving(false); }
  }

  async function createTask(phase: PhaseId) {
    if (!selectedTemplateId) return;
    const phaseInfo = PHASES.find(item => item.id === phase) || PHASES[1];
    setIsSaving(true); setError(null);
    try {
      const created = await mutation('/api/hr/onboarding?view=tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: selectedTemplateId, title: 'Untitled checklist step', description: '', detailedInstructions: '', tags: [], ownerRole: 'employee', dueDay: phaseInfo.defaultDueDay, sortOrder: templateTasks.length + 1, isRequired: 'true', employeeVisibility: 'visible' }) }, 'Unable to add checklist step.');
      await load();
      if (created?.id) { setEditingTaskId(created.id); setDraft(taskDraft(created)); }
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to add checklist step.'); }
    finally { setIsSaving(false); }
  }

  function beginEdit(task: AdminRecord) { setEditingTaskId(task.id); setDraft(taskDraft(task)); setError(null); }

  async function saveTask() {
    if (!editingTaskId || !draft.title.trim()) return;
    setIsSaving(true); setError(null);
    try {
      await mutation(`/api/hr/onboarding?view=tasks&id=${encodeURIComponent(editingTaskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: draft.title.trim(), description: draft.description.trim() || null, detailedInstructions: draft.detailedInstructions.trim() || null, tags: draft.tags.split(',').map(tag => tag.trim()).filter(Boolean), ownerRole: draft.ownerRole, dueDay: Number(draft.dueDay), isRequired: String(draft.isRequired), employeeVisibility: draft.employeeVisibility }) }, 'Unable to save checklist step.');
      setEditingTaskId(null); setNotice('Checklist step saved.'); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save checklist step.'); }
    finally { setIsSaving(false); }
  }

  async function removeTasks(ids: string[]) {
    if (!ids.length) return;
    setIsSaving(true); setError(null);
    try {
      for (const id of ids) await mutation(`/api/hr/onboarding?view=tasks&id=${encodeURIComponent(id)}`, { method: 'DELETE' }, 'Unable to delete checklist step.');
      setSelectedTaskIds(new Set()); if (editingTaskId && ids.includes(editingTaskId)) setEditingTaskId(null);
      setNotice(`${ids.length} checklist step${ids.length === 1 ? '' : 's'} deleted.`); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to delete checklist steps.'); }
    finally { setIsSaving(false); }
  }

  async function duplicateTasks(ids: string[]) {
    const sourceTasks = templateTasks.filter(task => ids.includes(task.id));
    if (!sourceTasks.length) return;
    setIsSaving(true); setError(null);
    try {
      for (const [index, task] of sourceTasks.entries()) {
        const current = taskDraft(task);
        await mutation('/api/hr/onboarding?view=tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: selectedTemplateId, title: `${current.title} copy`, description: current.description || null, detailedInstructions: current.detailedInstructions || null, tags: current.tags.split(',').map(tag => tag.trim()).filter(Boolean), ownerRole: current.ownerRole, dueDay: Number(current.dueDay), sortOrder: templateTasks.length + index + 1, isRequired: String(current.isRequired), employeeVisibility: current.employeeVisibility }) }, 'Unable to duplicate checklist step.');
      }
      setSelectedTaskIds(new Set()); setNotice(`${sourceTasks.length} checklist step${sourceTasks.length === 1 ? '' : 's'} duplicated.`); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to duplicate checklist steps.'); }
    finally { setIsSaving(false); }
  }

  async function moveTasksToPhase(ids: string[], phase: PhaseId) {
    const dueDay = PHASES.find(item => item.id === phase)?.defaultDueDay ?? 3;
    setIsSaving(true); setError(null);
    try {
      await Promise.all(ids.map(id => mutation(`/api/hr/onboarding?view=tasks&id=${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dueDay }) }, 'Unable to move checklist step.')));
      setSelectedTaskIds(new Set()); setNotice('Selected steps moved.'); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to move checklist steps.'); }
    finally { setIsSaving(false); }
  }

  async function reorderTask(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const ordered = [...templateTasks];
    const from = ordered.findIndex(task => task.id === sourceId);
    const to = ordered.findIndex(task => task.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ordered.splice(from, 1); ordered.splice(to, 0, moved);
    setTasks(current => current.map(task => {
      const index = ordered.findIndex(item => item.id === task.id);
      return index >= 0 ? { ...task, sortOrder: index + 1 } : task;
    }));
    try {
      await Promise.all(ordered.map((task, index) => mutation(`/api/hr/onboarding?view=tasks&id=${encodeURIComponent(task.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: index + 1 }) }, 'Unable to reorder checklist steps.')));
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to reorder checklist steps.'); await load(); }
  }

  async function publishTemplate() {
    if (!selectedTemplate) return;
    setIsSaving(true); setError(null);
    try {
      await mutation(`/api/hr/onboarding?view=templates&id=${encodeURIComponent(selectedTemplate.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: 'true' }) }, 'Unable to publish onboarding template.');
      setNotice('Template published and ready for employee journeys.'); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to publish onboarding template.'); }
    finally { setIsSaving(false); }
  }

  async function importSteps(file: File) {
    const text = await file.text();
    const rows = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (rows[0]?.toLowerCase().includes('title')) rows.shift();
    setIsSaving(true); setError(null);
    try {
      for (const [index, row] of rows.entries()) {
        const [title, ownerRole = 'employee', dueDay = '0', description = ''] = row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        if (!title) continue;
        await mutation('/api/hr/onboarding?view=tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: selectedTemplateId, title, description, detailedInstructions: '', tags: [], ownerRole: ['hr', 'manager', 'employee', 'it'].includes(ownerRole) ? ownerRole : 'employee', dueDay: Number(dueDay) || 0, sortOrder: templateTasks.length + index + 1, isRequired: 'true', employeeVisibility: 'visible' }) }, 'Unable to import checklist steps.');
      }
      setNotice(`${rows.length} checklist step${rows.length === 1 ? '' : 's'} imported.`); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to import checklist steps.'); }
    finally { setIsSaving(false); if (importInputRef.current) importInputRef.current.value = ''; }
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedTaskIds(current => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
  }

  const allVisibleSelected = filteredTasks.length > 0 && filteredTasks.every(task => selectedTaskIds.has(task.id));
  const isPublished = asBoolean(selectedTemplate ? value(selectedTemplate, 'isActive', 'is_active') : false);

  return (
    <main className={cn('min-h-full bg-[#f7f9fc] text-[#172033] dark:bg-[#07111d] dark:text-zinc-50', embedded ? 'p-0' : 'px-4 py-7 sm:px-6 lg:px-8')}>
      <div className={cn('overflow-hidden border-slate-200 bg-white dark:border-[#263548] dark:bg-[#0b1725]', embedded ? 'min-h-[720px] border-0' : 'rounded-xl border')}>
        <header className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 dark:border-[#263548] sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {!embedded && <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full"><Link href="/people/onboarding" aria-label="View employee journeys"><ArrowLeftIcon className="h-5 w-5" /></Link></Button>}
            <label className="relative min-w-0">
              <span className="sr-only">Checklist template</span>
              <select value={selectedTemplateId} onChange={event => setSelectedTemplateId(event.target.value)} className="max-w-[330px] appearance-none bg-transparent py-1 pr-8 text-lg font-bold tracking-[-0.025em] outline-none">
                {templates.map(template => <option key={template.id} value={template.id}>{String(template.name || 'Untitled template')}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
            <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-semibold', isPublished ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300')}>{isPublished ? 'Published' : 'Draft'}</span>
            <span className="shrink-0 text-xs text-slate-500">{templateTasks.length} steps</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewTemplate(current => !current)} aria-label="Create template"><PlusIcon className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[190px] flex-1 xl:w-[220px] xl:flex-none"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search steps..." className="h-9 pl-9 dark:border-[#32445a] dark:bg-[#0d1b2a]" /></label>
            <Button asChild variant="outline" size="sm" className="h-9 dark:border-[#285b9d] dark:bg-transparent dark:text-blue-300"><Link href="/people/onboarding"><EyeIcon className="mr-2 h-4 w-4" />Preview journey</Link></Button>
            <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void importSteps(file); }} />
            <Button type="button" variant="outline" size="sm" className="h-9 dark:border-[#285b9d] dark:bg-transparent dark:text-blue-300" onClick={() => importInputRef.current?.click()} disabled={!selectedTemplateId || isSaving}><ArrowDownTrayIcon className="mr-2 h-4 w-4" />Import steps</Button>
            <Button type="button" size="sm" className="h-9 bg-[#1769e0] px-5 hover:bg-[#1257bc]" onClick={() => void publishTemplate()} disabled={!selectedTemplate || !templateTasks.length || isSaving}>{isPublished ? 'Republish template' : 'Publish template'}</Button>
          </div>
        </header>

        {showNewTemplate && <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-[#263548] dark:bg-[#0d1b2a]"><Label htmlFor="new-template" className="mr-2">New template</Label><Input id="new-template" autoFocus value={newTemplateName} onChange={event => setNewTemplateName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void createTemplate(); }} placeholder="Template name" className="h-9 max-w-sm" /><Button size="sm" disabled={!newTemplateName.trim() || isSaving} onClick={() => void createTemplate()}>Create draft</Button><Button size="icon" variant="ghost" onClick={() => setShowNewTemplate(false)} aria-label="Cancel new template"><XMarkIcon className="h-4 w-4" /></Button></div>}
        {(error || notice) && <div className={cn('border-b px-5 py-2.5 text-sm dark:border-[#263548]', error ? 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300')} role={error ? 'alert' : 'status'}>{error || notice}</div>}

        {selectedTaskIds.size > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-[#263548] dark:bg-[#0d1b2a]"><span className="mr-2 text-sm font-medium">{selectedTaskIds.size} selected</span><Button size="sm" variant="outline" onClick={() => void duplicateTasks([...selectedTaskIds])} disabled={isSaving}><DocumentDuplicateIcon className="mr-2 h-4 w-4" />Duplicate</Button><select value={bulkPhase} onChange={event => setBulkPhase(event.target.value as PhaseId)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{PHASES.map(phase => <option key={phase.id} value={phase.id}>Move to {phase.label}</option>)}</select><Button size="sm" variant="outline" onClick={() => void moveTasksToPhase([...selectedTaskIds], bulkPhase)} disabled={isSaving}>Move</Button><Button size="sm" variant="outline" className="text-rose-600" onClick={() => void removeTasks([...selectedTaskIds])} disabled={isSaving}><TrashIcon className="mr-2 h-4 w-4" />Delete</Button><button type="button" className="ml-auto text-xs font-semibold text-[#1769e0]" onClick={() => setSelectedTaskIds(new Set())}>Clear selection</button></div>}

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[42px_54px_minmax(260px,1fr)_160px_190px_96px_150px_120px] items-center border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:border-[#263548] dark:bg-[#091522] dark:text-zinc-400">
              <Checkbox checked={allVisibleSelected} onCheckedChange={checked => setSelectedTaskIds(checked ? new Set(filteredTasks.map(task => task.id)) : new Set())} aria-label="Select all visible steps" /><span>Order</span><span>Task title</span><span>Owner</span><span>Due timing</span><span>Required</span><span>Employee visibility</span><span className="text-right">Actions</span>
            </div>

            {PHASES.map(phase => {
              const phaseTasks = filteredTasks.filter(task => taskPhase(task) === phase.id);
              return <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
                <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 dark:border-[#263548] dark:bg-[#0c1927]"><ChevronDownIcon className="mr-2 h-4 w-4 text-slate-400" /><h2 id={`phase-${phase.id}`} className="text-sm font-semibold">{phase.label}</h2><span className="ml-2 text-xs text-slate-500">({phaseTasks.length})</span><Button type="button" variant="ghost" size="sm" className="ml-auto h-7 text-xs text-[#1769e0] dark:text-blue-300" onClick={() => void createTask(phase.id)} disabled={!selectedTemplateId || isSaving}><PlusIcon className="mr-1 h-3.5 w-3.5" />Add step</Button></div>
                {phaseTasks.map((task, phaseIndex) => {
                  const currentDraft = editingTaskId === task.id ? draft : null;
                  const required = asBoolean(value(task, 'isRequired', 'is_required'), true);
                  const visibility = String(value(task, 'employeeVisibility', 'employee_visibility') || 'visible');
                  return <React.Fragment key={task.id}>
                    <article draggable onDragStart={() => setDraggingTaskId(task.id)} onDragEnd={() => setDraggingTaskId(null)} onDragOver={event => event.preventDefault()} onDrop={() => { if (draggingTaskId) void reorderTask(draggingTaskId, task.id); setDraggingTaskId(null); }} onClick={() => beginEdit(task)} className={cn('grid cursor-pointer grid-cols-[42px_54px_minmax(260px,1fr)_160px_190px_96px_150px_120px] items-center border-b border-slate-200 px-4 py-2.5 text-xs transition-colors hover:bg-slate-50 dark:border-[#263548] dark:hover:bg-[#102033]', editingTaskId === task.id && 'bg-blue-50/60 ring-1 ring-inset ring-[#1769e0] dark:bg-blue-950/20', draggingTaskId === task.id && 'opacity-50')}>
                      <Checkbox checked={selectedTaskIds.has(task.id)} onClick={event => event.stopPropagation()} onCheckedChange={checked => toggleSelected(task.id, Boolean(checked))} aria-label={`Select ${String(task.title || 'checklist step')}`} />
                      <span className="flex items-center gap-2 text-slate-400"><Bars3Icon className="h-4 w-4 cursor-grab" />{phaseIndex + 1}</span>
                      <span className="truncate font-medium">{String(task.title || 'Untitled checklist step')}</span>
                      <span className="flex items-center gap-1.5 capitalize text-slate-600 dark:text-zinc-300">{String(value(task, 'ownerRole', 'owner_role') || 'employee')}</span>
                      <span className="text-slate-600 dark:text-zinc-300">{phaseLabel(task)}</span>
                      <span><span className={cn('rounded border px-2 py-0.5 text-[11px] font-semibold', required ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-slate-300 text-slate-500 dark:border-zinc-700')}>{required ? 'Yes' : 'No'}</span></span>
                      <span className="capitalize text-slate-600 dark:text-zinc-300">{visibility.replace(/_/g, ' ')}</span>
                      <span className="flex justify-end gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={event => { event.stopPropagation(); const prior = templateTasks[templateTasks.findIndex(item => item.id === task.id) - 1]; if (prior) void reorderTask(task.id, prior.id); }} aria-label="Move step up"><ArrowUpIcon className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={event => { event.stopPropagation(); const next = templateTasks[templateTasks.findIndex(item => item.id === task.id) + 1]; if (next) void reorderTask(task.id, next.id); }} aria-label="Move step down"><ArrowDownIcon className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600" onClick={event => { event.stopPropagation(); void removeTasks([task.id]); }} aria-label="Delete step"><TrashIcon className="h-3.5 w-3.5" /></Button></span>
                    </article>
                    {currentDraft && <TaskEditor draft={currentDraft} setDraft={setDraft} isSaving={isSaving} onCancel={() => setEditingTaskId(null)} onSave={() => void saveTask()} />}
                  </React.Fragment>;
                })}
              </section>;
            })}

            {!isLoading && !templateTasks.length && <div className="px-6 py-16 text-center"><h2 className="text-lg font-semibold">No checklist steps yet</h2><p className="mt-2 text-sm text-slate-500">Add the first step to Before start, First week, or First 30 days.</p><Button className="mt-5" onClick={() => void createTask('before_start')} disabled={!selectedTemplateId || isSaving}><PlusIcon className="mr-2 h-4 w-4" />Add first step</Button></div>}
            {isLoading && <div className="space-y-1 p-4">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />)}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}

function TaskEditor({ draft, setDraft, isSaving, onCancel, onSave }: {
  draft: TaskDraft;
  setDraft: React.Dispatch<React.SetStateAction<TaskDraft>>;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return <div className="grid gap-x-8 gap-y-4 border-b border-slate-200 bg-slate-50/60 px-11 py-5 dark:border-[#263548] dark:bg-[#0d1b2a] lg:grid-cols-2">
    <div className="space-y-4"><div className="grid gap-2"><Label htmlFor="step-title">Task title</Label><Input id="step-title" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="step-description">Description</Label><Textarea id="step-description" rows={2} value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="step-instructions">Detailed instructions</Label><Textarea id="step-instructions" rows={2} value={draft.detailedInstructions} onChange={event => setDraft(current => ({ ...current, detailedInstructions: event.target.value }))} placeholder="Add practical completion guidance." /></div><div className="grid gap-2"><Label htmlFor="step-tags">Tags</Label><Input id="step-tags" value={draft.tags} onChange={event => setDraft(current => ({ ...current, tags: event.target.value }))} placeholder="equipment, access" /></div></div>
    <div className="space-y-4"><div className="grid gap-2"><Label htmlFor="step-owner">Owner</Label><select id="step-owner" value={draft.ownerRole} onChange={event => setDraft(current => ({ ...current, ownerRole: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR Operations</option><option value="it">IT Operations</option></select></div><div className="grid gap-2"><Label htmlFor="step-day">Due timing</Label><select id="step-day" value={draft.dueDay} onChange={event => setDraft(current => ({ ...current, dueDay: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="-7">7 days before start</option><option value="-3">3 days before start</option><option value="-1">1 day before start</option><option value="0">On start date</option><option value="1">Within 1 day of start</option><option value="3">Within 3 days of start</option><option value="5">Within 5 days of start</option><option value="7">Within 7 days of start</option><option value="14">Within 14 days of start</option><option value="30">Within 30 days of start</option></select></div><div className="flex items-center justify-between border-y border-slate-200 py-3 dark:border-[#263548]"><div><Label htmlFor="step-required">Required</Label><p className="mt-0.5 text-xs text-slate-500">Required to complete the employee journey.</p></div><Switch id="step-required" checked={draft.isRequired} onCheckedChange={checked => setDraft(current => ({ ...current, isRequired: checked }))} /></div><div className="grid gap-2"><Label htmlFor="step-visibility">Employee visibility</Label><select id="step-visibility" value={draft.employeeVisibility} onChange={event => setDraft(current => ({ ...current, employeeVisibility: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="visible">Visible to employee</option><option value="after_assigned">Visible after assigned</option><option value="hidden">Hidden from employee</option></select></div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="button" onClick={onSave} disabled={!draft.title.trim() || isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button></div></div>
  </div>;
}
