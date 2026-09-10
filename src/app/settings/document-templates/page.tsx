"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Braces, Check, ChevronLeft, CloudDownload, Code2, Copy, Eye, FileOutput, FilePlus2, FileText,
  Loader2, Plus, Search, Sparkles, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';
import { cn } from '@/lib/utils';
import {
  DOCUMENT_ATTRIBUTES,
  type DocumentAttribute, type DocumentTemplate,
} from '@/lib/document-templates';

const groups = ['Employee', 'Employment', 'Company', 'Document'] as const;

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [attributeQuery, setAttributeQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appKitLoad, setAppKitLoad] = useState<{
    environment: 'development' | 'production';
    percent: number;
    message: string;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [insertRequest, setInsertRequest] = useState<{ id: number; content: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings/document-templates')
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load document templates.');
        return response.json() as Promise<{ templates: DocumentTemplate[] }>;
      })
      .then(data => {
        setTemplates(data.templates);
        setSelectedId(data.templates[0]?.id || '');
      })
      .catch(error => toast.error(error instanceof Error ? error.message : 'Unable to load templates.'))
      .finally(() => setLoading(false));
  }, []);

  const selected = templates.find(template => template.id === selectedId) || null;
  const filteredTemplates = templates.filter(template => (
    `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(query.toLowerCase())
  ));
  const filteredAttributes = useMemo(() => DOCUMENT_ATTRIBUTES.filter(attribute => (
    `${attribute.label} ${attribute.key} ${attribute.group}`.toLowerCase().includes(attributeQuery.toLowerCase())
  )), [attributeQuery]);

  const updateSelected = (updates: Partial<DocumentTemplate>) => {
    setTemplates(current => current.map(template => template.id === selectedId
      ? { ...template, ...updates, updatedAt: new Date().toISOString() }
      : template));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/document-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });
      if (!response.ok) throw new Error('Unable to save document templates.');
      setDirty(false);
      toast.success('Document templates saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save templates.');
    } finally {
      setSaving(false);
    }
  };

  const loadFromAppKit = async () => {
    setAppKitLoad({ environment: 'production', percent: 10, message: 'Preparing request' });
    try {
      const response = await fetch('/api/settings/document-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: 'production' }),
      });
      setAppKitLoad((current) => current ? { ...current, percent: 55, message: 'Loading template catalog' } : null);
      const payload = await response.json() as { templates?: DocumentTemplate[]; count?: number; error?: string };
      if (!response.ok || !payload.templates) throw new Error(payload.error || 'Unable to load document templates from AppKit.');
      setTemplates(payload.templates);
      setSelectedId(payload.templates[0]?.id || '');
      setDirty(false);
      setAppKitLoad((current) => current ? { ...current, percent: 95, message: 'Applying templates' } : null);
      toast.success(payload.count ? `Loaded ${payload.count} document templates from AppKit.` : 'AppKit has no document templates yet.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load document templates from AppKit.');
    } finally {
      setAppKitLoad(null);
    }
  };
  const isLoadingAppKit = appKitLoad !== null;

  const addTemplate = () => {
    const template: DocumentTemplate = {
      id: crypto.randomUUID(),
      name: 'Untitled document',
      description: 'Describe when employees should use this document.',
      category: 'General',
      content: '<h2>Document title</h2><p>Start writing your template. Select an attribute from the guide to insert live employee or company data.</p>',
      status: 'draft',
      isConfidential: false,
      employeeCanDownload: true,
      updatedAt: new Date().toISOString(),
    };
    setTemplates(current => [...current, template]);
    setSelectedId(template.id);
    setDirty(true);
  };

  const duplicateTemplate = () => {
    if (!selected) return;
    const copy = { ...selected, id: crypto.randomUUID(), name: `${selected.name} copy`, status: 'draft' as const, updatedAt: new Date().toISOString() };
    setTemplates(current => [...current, copy]);
    setSelectedId(copy.id);
    setDirty(true);
  };

  const removeTemplate = () => {
    if (!selected || !window.confirm(`Delete “${selected.name}”?`)) return;
    const remaining = templates.filter(template => template.id !== selected.id);
    setTemplates(remaining);
    setSelectedId(remaining[0]?.id || '');
    setDirty(true);
  };

  const insertAttribute = (attribute: DocumentAttribute) => {
    setInsertRequest({ id: Date.now(), content: `{{${attribute.key}}}` });
  };

  if (loading) return <LoadingState />;

  return (
    <div className="flex h-full min-h-[calc(100dvh-64px)] flex-col overflow-hidden bg-[#f5f6f8] text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0"><a href="/settings" aria-label="Back to Admin Center"><ChevronLeft className="h-4 w-4" /></a></Button>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><FileOutput className="h-5 w-5" /></span>
          <div className="min-w-0"><h1 className="truncate text-base font-semibold">Document templates</h1><p className="truncate text-xs text-slate-500 dark:text-zinc-400">Power employee self-service with ready-to-generate documents</p></div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="hidden text-xs text-amber-700 dark:text-amber-300 sm:inline">Unsaved changes</span>}
          <Button onClick={() => void loadFromAppKit()} disabled={isLoadingAppKit || saving} variant="outline" size="sm">
            {isLoadingAppKit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
            {appKitLoad ? `${appKitLoad.percent}% · ${appKitLoad.message}` : 'Load from AppKit'}
          </Button>
          <Button onClick={() => void save()} disabled={!dirty || saving} size="sm">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save changes</Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(440px,1fr)_300px]">
        <aside className="hidden min-h-0 flex-col border-r border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
          <div className="space-y-3 border-b border-slate-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Templates · {templates.length}</span><Button size="icon" variant="ghost" className="h-8 w-8" onClick={addTemplate} aria-label="New template"><Plus className="h-4 w-4" /></Button></div>
            <SearchBox value={query} onChange={setQuery} placeholder="Find a template" />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredTemplates.map(template => <button key={template.id} type="button" onClick={() => setSelectedId(template.id)} className={cn('mb-1 w-full rounded-md px-3 py-3 text-left transition-colors', selectedId === template.id ? 'bg-blue-50 text-blue-950 dark:bg-blue-950/60 dark:text-blue-100' : 'hover:bg-slate-50 dark:hover:bg-zinc-800')}><div className="flex items-start gap-2.5"><FileText className={cn('mt-0.5 h-4 w-4 shrink-0', selectedId === template.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} /><div className="min-w-0"><p className="truncate text-sm font-medium">{template.name}</p><div className="mt-1 flex items-center gap-2"><span className="text-[11px] text-slate-500 dark:text-zinc-400">{template.category}</span><StatusDot status={template.status} /></div></div></div></button>)}
          </div>
          <div className="border-t border-slate-200 p-3 dark:border-zinc-800"><Button variant="outline" className="w-full" size="sm" onClick={addTemplate}><FilePlus2 className="mr-2 h-4 w-4" />New template</Button></div>
        </aside>

        <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
          {selected ? <div className="mx-auto max-w-[820px] space-y-5">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <Input aria-label="Template name" value={selected.name} onChange={event => updateSelected({ name: event.target.value })} className="h-auto border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0" />
                <Input aria-label="Template description" value={selected.description} onChange={event => updateSelected({ description: event.target.value })} className="h-auto border-0 bg-transparent px-0 text-sm text-slate-500 shadow-none focus-visible:ring-0 dark:text-zinc-400" />
              </div>
              <div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={duplicateTemplate} title="Duplicate template"><Copy className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={removeTemplate} title="Delete template" className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5"><Label htmlFor="template-category">Category</Label><Input id="template-category" value={selected.category} onChange={event => updateSelected({ category: event.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="template-status">ESS availability</Label><select id="template-status" value={selected.status} onChange={event => updateSelected({ status: event.target.value as DocumentTemplate['status'] })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="active">Active — employees can generate</option><option value="draft">Draft — hidden from employees</option></select></div>
              <div className="space-y-1.5"><Label htmlFor="template-confidentiality">Confidentiality</Label><select id="template-confidentiality" value={selected.isConfidential ? 'confidential' : 'not-confidential'} onChange={event => updateSelected({ isConfidential: event.target.value === 'confidential' })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="not-confidential">Not confidential</option><option value="confidential">Confidential</option></select></div>
              <div className="space-y-1.5"><Label htmlFor="template-download-access">Employee download</Label><select id="template-download-access" value={selected.employeeCanDownload ? 'allowed' : 'blocked'} onChange={event => updateSelected({ employeeCanDownload: event.target.value === 'allowed' })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="allowed">Allowed — show in My Documents</option><option value="blocked">Blocked — HR only</option></select></div>
            </div>
            <section className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Label>Document body</Label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Add images from the toolbar. Attributes are replaced with live data when an employee generates the document.</p>
                </div>
                <div className="inline-flex w-fit rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800" role="group" aria-label="Editor mode">
                  <Button type="button" size="sm" variant={editorMode === 'visual' ? 'secondary' : 'ghost'} onClick={() => setEditorMode('visual')} className="h-7 px-2.5 text-xs" aria-pressed={editorMode === 'visual'}><Eye className="mr-1.5 h-3.5 w-3.5" />Visual</Button>
                  <Button type="button" size="sm" variant={editorMode === 'html' ? 'secondary' : 'ghost'} onClick={() => setEditorMode('html')} className="h-7 px-2.5 text-xs" aria-pressed={editorMode === 'html'}><Code2 className="mr-1.5 h-3.5 w-3.5" />HTML</Button>
                </div>
              </div>
              {editorMode === 'visual' ? (
                <TiptapEditor value={selected.content} onChange={content => updateSelected({ content })} insertContentRequest={insertRequest} enableImages placeholder="Write the document template…" className="min-h-[520px] bg-white shadow-sm dark:bg-zinc-900 [&_.ProseMirror]:min-h-[440px] [&_.ProseMirror]:px-8 [&_.ProseMirror]:py-7 [&_.ProseMirror_img]:my-4 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-md" />
              ) : (
                <Textarea aria-label="Document body HTML" value={selected.content} onChange={event => updateSelected({ content: event.target.value })} spellCheck={false} className="min-h-[520px] resize-y bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-100 shadow-sm focus-visible:ring-blue-500 dark:bg-zinc-950" placeholder="Enter document HTML…" />
              )}
            </section>
          </div> : <EmptyTemplates onCreate={addTemplate} onLoad={() => void loadFromAppKit()} appKitLoad={appKitLoad} />}
        </main>

        <aside className="hidden min-h-0 flex-col border-l border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
          <div className="border-b border-slate-200 p-4 dark:border-zinc-800"><div className="flex items-center gap-2"><Braces className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-semibold">Attribute guide</h2></div><p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-zinc-400">Click an attribute to insert it at the cursor. Preview values show what employees will see.</p><div className="mt-3"><SearchBox value={attributeQuery} onChange={setAttributeQuery} placeholder="Search attributes" /></div></div>
          <div className="flex-1 overflow-y-auto p-3">{groups.map(group => { const attributes = filteredAttributes.filter(attribute => attribute.group === group); if (!attributes.length) return null; return <section key={group} className="mb-5"><h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group}</h3><div className="space-y-1">{attributes.map(attribute => <button key={attribute.key} type="button" onClick={() => insertAttribute(attribute)} className="group w-full rounded-md px-2.5 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{attribute.label}</span><Plus className="h-3.5 w-3.5 shrink-0 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100" /></div><code className="mt-1 block truncate text-[11px] text-blue-700 dark:text-blue-300">{`{{${attribute.key}}}`}</code><span className="mt-1 block truncate text-[11px] text-slate-400">Example: {attribute.example}</span></button>)}</div></section>; })}</div>
          <div className="border-t border-slate-200 bg-blue-50/70 p-4 dark:border-zinc-800 dark:bg-blue-950/30"><div className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p className="text-xs leading-5 text-blue-950 dark:text-blue-100"><strong>Self-service ready.</strong> Active templates appear in My Documents. Employees generate standard letters instantly and only contact HR for exceptional requests.</p></div></div>
        </aside>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><Input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-9 pl-8 text-xs" /></div>; }
function StatusDot({ status }: { status: DocumentTemplate['status'] }) { return <span className={cn('inline-flex items-center gap-1 text-[11px]', status === 'active' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}><span className={cn('h-1.5 w-1.5 rounded-full', status === 'active' ? 'bg-emerald-500' : 'bg-amber-500')} />{status === 'active' ? 'Active' : 'Draft'}</span>; }
function LoadingState() { return <div className="grid min-h-[calc(100dvh-64px)] place-items-center bg-[#f5f6f8] dark:bg-zinc-950"><div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" /><p className="mt-3 text-sm text-slate-500">Preparing the template studio…</p></div></div>; }
function EmptyTemplates({ onCreate, onLoad, appKitLoad }: { onCreate: () => void; onLoad: () => void; appKitLoad: { environment: 'development' | 'production'; percent: number; message: string; } | null }) { return <div className="grid min-h-[520px] place-items-center"><div className="max-w-sm text-center"><FileOutput className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-4 font-semibold">No document templates</h2><p className="mt-2 text-sm text-slate-500">Load the shared catalog from AppKit or create a template here.</p><div className="mt-5 flex justify-center gap-2"><Button variant="outline" onClick={onLoad} disabled={!!appKitLoad}>{appKitLoad ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}{appKitLoad ? `${appKitLoad.percent}% · ${appKitLoad.message}` : 'Load from AppKit'}</Button><Button onClick={onCreate}>Create template</Button></div></div></div>; }
