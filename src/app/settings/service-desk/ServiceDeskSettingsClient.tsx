"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Bot, Check, CheckCircle2, Database, FileText, GripVertical, Loader2, Plus, Save, Search, Trash2, Upload, UserRoundCheck, UsersRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type KnowledgeDocument = { id: string; fileName: string; mimeType: string; sizeBytes: number; status: string; chunkCount: number; updatedAt: string };
type Category = { id: string | null; key: string; label: string; isActive: boolean; aiEnabled: boolean; systemPrompt: string; sortOrder: number; assigneeIds: string[]; knowledgeDocuments: KnowledgeDocument[] };
type HrUser = { id: string; name: string; email: string; role: string };

export function ServiceDeskSettingsClient({ canEdit }: { canEdit: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hrUsers, setHrUsers] = useState<HrUser[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selected = categories.find(category => category.key === selectedKey) || null;
  const assignedUsers = useMemo(() => new Set(categories.flatMap(category => category.assigneeIds)).size, [categories]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/settings/service-desk-categories', { cache: 'no-store' });
      const payload = await response.json() as { categories?: Category[]; hrUsers?: HrUser[]; message?: string };
      if (!response.ok || !payload.categories) throw new Error(payload.message || 'Unable to load service desk settings.');
      setCategories(payload.categories);
      setHrUsers(payload.hrUsers || []);
      setSelectedKey(current => current && payload.categories?.some(category => category.key === current) ? current : payload.categories?.[0]?.key || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load service desk settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function updateSelected(updates: Partial<Category>) {
    if (!selectedKey) return;
    setCategories(current => current.map(category => category.key === selectedKey ? { ...category, ...updates } : category));
    if (updates.key) setSelectedKey(updates.key);
    setMessage('');
  }

  function addCategory() {
    let key = 'new_category';
    let suffix = 2;
    while (categories.some(category => category.key === key)) key = `new_category_${suffix++}`;
    setCategories(current => [...current, { id: null, key, label: 'New category', isActive: true, aiEnabled: false, systemPrompt: '', sortOrder: Math.max(0, ...categories.map(category => category.sortOrder)) + 10, assigneeIds: [], knowledgeDocuments: [] }]);
    setSelectedKey(key);
    setMessage('');
  }

  function toggleAssignee(userId: string) {
    if (!selected) return;
    updateSelected({ assigneeIds: selected.assigneeIds.includes(userId) ? selected.assigneeIds.filter(id => id !== userId) : [...selected.assigneeIds, userId] });
  }

  async function save() {
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/settings/service-desk-categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: categories.map(({ knowledgeDocuments: _documents, ...category }) => category) }) });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to save service desk settings.');
      setMessage('Service desk routing, AI, and knowledge settings saved.');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save service desk settings.');
    } finally { setSaving(false); }
  }

  async function uploadKnowledgeDocument(file?: File) {
    if (!selected?.id || !file) { setError('Save this category before uploading knowledge documents.'); return; }
    setUploading(true); setError(''); setMessage('');
    try {
      const body = new FormData(); body.set('file', file);
      const response = await fetch(`/api/settings/service-desk-categories/${selected.id}/knowledge-base`, { method: 'POST', body });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to index this document.');
      setMessage(`${file.name} was added to this category's knowledge base.`);
      await load();
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Unable to index this document.'); }
    finally { setUploading(false); }
  }

  async function deleteKnowledgeDocument(document: KnowledgeDocument) {
    setDeletingDocumentId(document.id); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/settings/service-desk-knowledge/${document.id}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to remove this document.');
      setMessage(`${document.fileName} was removed from the knowledge base.`);
      await load();
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove this document.'); }
    finally { setDeletingDocumentId(null); }
  }

  const invalid = categories.some(category => !category.label.trim() || !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(category.key)) || new Set(categories.map(category => category.key)).size !== categories.length;
  const filteredUsers = hrUsers.filter(user => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()));

  return <main className="min-h-full bg-[#f5f6f9] p-4 text-[#20242c] dark:bg-zinc-950 dark:text-zinc-100 sm:p-5">
    <div className="w-full space-y-4">
      <header className="flex flex-col gap-4 border-b border-[#dfe2e8] pb-4 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#315f9f] dark:text-blue-300">HR setup · Employee support</p><h1 className="mt-1 text-xl font-semibold tracking-tight">Service desk</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[#727782] dark:text-zinc-400">Configure employee topics, grounded AI answers, approved knowledge, and one or more HR owners.</p></div>
        <div className="flex shrink-0 gap-2"><Button type="button" variant="outline" onClick={() => void load()} disabled={loading || saving}>Refresh</Button>{canEdit && <Button type="button" onClick={() => void save()} disabled={loading || saving || invalid}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving…' : 'Save settings'}</Button>}</div>
      </header>
      {(error || message) && <div role="status" className={cn('rounded-[6px] border px-3 py-2 text-sm', error ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300')}>{error || <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />{message}</span>}</div>}
      <section className="grid overflow-hidden rounded-[6px] border border-[#dfe2e8] bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3"><Summary label="Categories" value={categories.length} helper="Employee-facing topics" /><Summary label="AI enabled" value={categories.filter(category => category.aiEnabled).length} helper="Grounded category assistants" /><Summary label="HR owners" value={assignedUsers} helper="People available for human support" /></section>

      <section className="grid min-h-[650px] overflow-hidden rounded-[6px] border border-[#dfe2e8] bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-[#dfe2e8] bg-[#fbfbfc] dark:border-zinc-800 dark:bg-zinc-950 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-[#dfe2e8] px-4 py-3 dark:border-zinc-800"><div><h2 className="text-sm font-semibold">Talk with HR categories</h2><p className="mt-0.5 text-xs text-muted-foreground">Select a category to configure</p></div>{canEdit && <Button type="button" size="icon" variant="outline" onClick={addCategory} aria-label="Add service desk category"><Plus className="h-4 w-4" /></Button>}</div>
          <div className="p-3">{loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading categories…</div> : <div className="space-y-1">{[...categories].sort((a,b) => a.sortOrder-b.sortOrder).map(item => <button key={item.key} type="button" onClick={() => setSelectedKey(item.key)} className={cn('flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2.5 text-left transition-colors', selectedKey === item.key ? 'bg-[#eaf1fa] text-[#245b9e] dark:bg-blue-950/60 dark:text-blue-200' : 'hover:bg-[#eef1f5] dark:hover:bg-zinc-900')}><GripVertical className="h-4 w-4 shrink-0 opacity-40" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.label}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.aiEnabled ? `${item.knowledgeDocuments.length} AI document${item.knowledgeDocuments.length === 1 ? '' : 's'}` : `${item.assigneeIds.length} HR owner${item.assigneeIds.length === 1 ? '' : 's'}`}</span></span><span className={cn('h-2 w-2 shrink-0 rounded-full', item.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600')} /></button>)}</div>}</div>
        </aside>

        <div className="p-5 sm:p-6">{selected ? <div className="max-w-3xl">
          <div className="border-b border-[#e6e8ed] pb-4 dark:border-zinc-800"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#315f9f] dark:text-blue-300">Category configuration</p><h2 className="mt-1 text-lg font-semibold">{selected.label}</h2><p className="mt-1 text-xs text-muted-foreground">Configure routing, AI guidance, approved knowledge, and human ownership for this topic.</p></div>
          <fieldset disabled={!canEdit || saving || uploading} className="mt-5 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]"><Field label="Employee-facing name"><Input value={selected.label} maxLength={80} onChange={event => updateSelected({ label: event.target.value })} /></Field><Field label="Routing key" hint="Stable after the first save."><Input value={selected.key} disabled={Boolean(selected.id)} onChange={event => updateSelected({ key: toCategoryKey(event.target.value) })} /></Field></div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]"><label className="flex items-center justify-between gap-4 rounded-[6px] border border-[#e2e5ea] px-3 py-3 dark:border-zinc-700"><span><span className="block text-sm font-medium">Available to employees</span><span className="mt-0.5 block text-xs text-muted-foreground">Prevent new conversations without removing history.</span></span><Switch checked={selected.isActive} onCheckedChange={isActive => updateSelected({ isActive })} /></label><Field label="Display order"><Input type="number" min="0" step="10" value={selected.sortOrder} onChange={event => updateSelected({ sortOrder: Number(event.target.value) || 0 })} /></Field></div>

            <Panel title="AI assistant" description="Answer from this category's approved knowledge before offering human support." icon={<Bot className="h-4 w-4 text-[#315f9f]" />} action={<Switch checked={selected.aiEnabled} onCheckedChange={aiEnabled => updateSelected({ aiEnabled })} aria-label="Enable AI assistant" />}>
              <Field label="Category system prompt" hint="Grounding and safety rules are always applied. This controls tone and category-specific guidance."><Textarea value={selected.systemPrompt} onChange={event => updateSelected({ systemPrompt: event.target.value })} maxLength={12000} rows={5} placeholder={`You are the HR assistant for ${selected.label}. Use clear, supportive language and follow company policy.`} /></Field>
            </Panel>

            <Panel title="Knowledge base" description="PDF, DOCX, TXT, and Markdown files are indexed in the vector database for this category only." icon={<Database className="h-4 w-4 text-[#315f9f]" />} action={<label className={cn('inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent', (!selected.id || uploading || !canEdit) && 'pointer-events-none opacity-50')}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload document<input type="file" className="sr-only" accept=".pdf,.docx,.txt,.md" disabled={!selected.id || uploading || !canEdit} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void uploadKnowledgeDocument(file); }} /></label>}>
              {!selected.id ? <p className="text-sm text-muted-foreground">Save the new category before adding documents.</p> : selected.knowledgeDocuments.length === 0 ? <div className="py-5 text-center text-sm text-muted-foreground"><FileText className="mx-auto h-7 w-7" /><p className="mt-2">No approved documents yet.</p></div> : <div className="divide-y divide-[#e2e5ea] dark:divide-zinc-700">{selected.knowledgeDocuments.map(document => <div key={document.id} className="flex items-center gap-3 py-3"><FileText className="h-5 w-5 shrink-0 text-[#315f9f]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{document.fileName}</span><span className="block text-xs text-muted-foreground">{formatFileSize(document.sizeBytes)} · {document.chunkCount} indexed chunk{document.chunkCount === 1 ? '' : 's'}</span></span>{canEdit && <Button type="button" size="icon" variant="ghost" disabled={deletingDocumentId === document.id} onClick={() => void deleteKnowledgeDocument(document)} aria-label={`Remove ${document.fileName}`}>{deletingDocumentId === document.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}</Button>}</div>)}</div>}
            </Panel>

            <Panel title="Assigned HR owners" description="Choose multiple people. Every selected owner can respond to human conversations in this category." icon={<UserRoundCheck className="h-4 w-4 text-[#315f9f]" />} action={<div className="relative sm:w-64"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find HR user" className="h-9 pl-9" /></div>}>
              <div className="max-h-64 overflow-y-auto">{filteredUsers.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground"><UsersRound className="mx-auto h-7 w-7" /><p className="mt-2">No eligible HR users found.</p></div> : filteredUsers.map(user => { const checked = selected.assigneeIds.includes(user.id); return <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-[4px] px-2.5 py-2 hover:bg-[#f1f4f7] dark:hover:bg-zinc-800"><input type="checkbox" checked={checked} onChange={() => toggleAssignee(user.id)} className="h-4 w-4 rounded border-slate-300 accent-[#315f9f]" /><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eaf1fa] text-xs font-semibold text-[#315f9f]">{initials(user.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{user.name}</span><span className="block truncate text-xs text-muted-foreground">{user.email}</span></span>{checked && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</label>; })}</div>
            </Panel>
          </fieldset>
          <div className="mt-5 flex items-center justify-between border-t border-[#e6e8ed] pt-4 dark:border-zinc-800">{canEdit ? <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700" disabled={!selected.isActive} onClick={() => { updateSelected({ isActive: false, aiEnabled: false }); setMessage('Category marked inactive. Save changes to apply.'); }}><Trash2 className="mr-2 h-4 w-4" />Deactivate category</Button> : <p className="text-xs text-muted-foreground">You have view-only access.</p>}<p className="text-xs text-muted-foreground">{selected.assigneeIds.length ? `${selected.assigneeIds.length} owner${selected.assigneeIds.length === 1 ? '' : 's'} assigned` : 'Assign at least one owner for human support'}</p></div>
        </div> : <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-muted-foreground"><UsersRound className="h-9 w-9" /><p className="mt-3 text-sm font-medium">Select a category</p></div>}</div>
      </section>
    </div>
  </main>;
}

function Panel({ title, description, icon, action, children }: { title: string; description: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) { return <section className="overflow-hidden rounded-[6px] border border-[#e2e5ea] dark:border-zinc-700"><div className="flex flex-col gap-3 border-b border-[#e2e5ea] bg-[#fbfbfc] px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h3><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>{action}</div><div className="p-4">{children}</div></section>; }
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>; }
function Summary({ label, value, helper }: { label: string; value: number; helper: string }) { return <div className="border-b border-[#e6e8ed] px-4 py-3 last:border-b-0 dark:border-zinc-800 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p><p className="text-[11px] text-muted-foreground">{helper}</p></div>; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'HR'; }
function toCategoryKey(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function formatFileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
