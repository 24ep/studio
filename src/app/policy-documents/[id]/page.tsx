"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Clock3, ExternalLink, FileText, Globe2, History, Link2, Loader2, LockKeyhole, Plus, Save, Settings2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';
import type { PolicyDocument, PolicyDocumentStatus } from '@/lib/policy-documents';

export default function PolicyDocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const [source, setSource] = useState<PolicyDocument | null>(null);
  const [title, setTitle] = useState(isNew ? 'Untitled policy' : 'Loading document…');
  const [content, setContent] = useState(isNew ? '<h1>Untitled policy</h1><p>Type / to add structure, media, and reusable content.</p>' : '');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState<PolicyDocumentStatus>('Draft');
  const [path, setPath] = useState(isNew ? '/policies/untitled' : '');
  const [portals, setPortals] = useState<PolicyDocument['portals']>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [externalLinks, setExternalLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    fetch('/api/policy-documents?environment=production', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load policy documents.');
        return data;
      })
      .then(data => {
        if (cancelled) return;
        const document = (data.documents || []).find((item: PolicyDocument) => item.id === id);
        if (!document) throw new Error('Policy document not found.');
        applyDocument(document);
      })
      .catch(error => toast.error(error instanceof Error ? error.message : 'Unable to load policy document.'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, isNew]);

  function applyDocument(document: PolicyDocument) {
    setSource(document);
    setTitle(document.title);
    setContent(document.content);
    setSummary(document.summary);
    setCategory(document.category);
    setStatus(document.status);
    setPath(document.path);
    setPortals(document.portals);
    setTags(document.tags || []);
    setExternalLinks(document.externalLinks || []);
  }

  const previewDocument = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:'DM Sans',sans-serif;max-width:760px;margin:0 auto;padding:40px;color:#172033;line-height:1.7}img{max-width:100%}h1,h2,h3{line-height:1.2}</style></head><body><h1>${escapeHtml(title)}</h1>${content}</body></html>`, [content, title]);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch('/api/policy-documents', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: isNew ? undefined : id, title, content, summary, category, status, path, portals, tags, externalLinks, versionNote: isNew ? 'Initial draft' : 'Policy content updated' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save the policy document.');
      applyDocument(payload.document);
      toast.success('Document saved as a new version.');
      if (isNew) router.replace(`/policy-documents/${payload.document.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save the policy document.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (isNew || !window.confirm(`Delete “${title}”? This removes the local policy and its version history.`)) return;
    const response = await fetch(`/api/policy-documents?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(payload.error || 'Unable to delete this policy document.');
    toast.success('Policy document deleted.');
    router.replace('/policy-documents');
  }

  function addExternalLink() {
    const url = window.prompt('External URL (https://…)')?.trim();
    if (!url) return;
    try { new URL(url); } catch { return toast.error('Enter a valid external URL.'); }
    const label = window.prompt('Link label')?.trim() || new URL(url).hostname;
    setExternalLinks(current => [...current, { label, url }]);
  }

  function addTag() {
    const tag = window.prompt('Classification tag')?.trim();
    if (tag && !tags.includes(tag)) setTags(current => [...current, tag]);
  }

  if (loading) return <main className="grid min-h-[70vh] place-items-center"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading policy document…</div></main>;

  return <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-slate-100 dark:bg-zinc-950">
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
      <div className="flex min-w-0 items-center gap-2"><Button asChild size="icon" variant="ghost"><Link href="/policy-documents" aria-label="Back to policy documents"><ArrowLeft className="h-4 w-4" /></Link></Button><FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="flex items-center gap-1 text-[11px] text-slate-500"><Check className="h-3 w-3 text-emerald-600" />{source?.updated ? `Saved ${new Date(source.updated).toLocaleString()}` : 'Unsaved draft'}</p></div></div>
      <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => setPreviewOpen(true)}><ExternalLink className="mr-2 h-4 w-4" />Preview</Button><Button size="sm" onClick={() => void save()} disabled={saving || !title.trim()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button></div>
    </header>
    <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(560px,1fr)_350px]">
      <section className="min-h-0 overflow-y-auto px-4 py-7 sm:px-8 lg:px-12"><div className="mx-auto max-w-[820px]"><Input value={title} onChange={event => setTitle(event.target.value)} aria-label="Document title" className="mb-5 h-auto border-0 bg-transparent px-1 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0" /><TiptapEditor value={content} onChange={setContent} enableImages placeholder="Type / for commands" className="min-h-[680px] rounded-lg border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 [&_.ProseMirror]:min-h-[600px] [&_.ProseMirror]:px-8 [&_.ProseMirror]:py-8 [&_.ProseMirror]:leading-7 sm:[&_.ProseMirror]:px-14" /></div></section>
      <aside className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Panel title="Publishing" icon={<Globe2 className="h-4 w-4" />} open><Field label="Status"><select value={status} onChange={event => setStatus(event.target.value as PolicyDocumentStatus)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Draft</option><option>In review</option><option>Published</option></select></Field><Field label="Page path"><div className="relative"><Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={path} onChange={event => setPath(event.target.value)} className="pl-9" /></div></Field><Field label="Summary"><Input value={summary} onChange={event => setSummary(event.target.value)} /></Field><Button type="button" variant="outline" size="sm" className="w-full" onClick={addExternalLink}><ExternalLink className="mr-2 h-4 w-4" />Add external link</Button>{externalLinks.map((link, index) => <div key={`${link.url}-${index}`} className="flex items-center gap-2 text-xs"><a className="min-w-0 flex-1 truncate text-primary hover:underline" href={link.url} target="_blank" rel="noreferrer">{link.label}</a><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExternalLinks(current => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3.5 w-3.5" /></Button></div>)}</Panel>
        <Panel title="Access & classification" icon={<LockKeyhole className="h-4 w-4" />} open><Field label="Who can view"><div className="space-y-2">{(['Employee portal', 'Job portal'] as const).map(portal => <label key={portal} className="flex items-center gap-2 rounded-md border p-2.5 text-sm"><input type="checkbox" checked={portals.includes(portal)} onChange={event => setPortals(current => event.target.checked ? [...current, portal] : current.filter(item => item !== portal))} /><Users className="h-4 w-4 text-slate-500" />{portal}</label>)}</div></Field><Field label="Category"><Input value={category} onChange={event => setCategory(event.target.value)} /></Field><div className="flex flex-wrap gap-1.5">{tags.map(tag => <button type="button" key={tag} onClick={() => setTags(current => current.filter(item => item !== tag))} title="Remove tag"><Badge variant="secondary">{tag} ×</Badge></button>)}<Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={addTag}><Plus className="mr-1 h-3 w-3" />Add</Button></div></Panel>
        <Panel title="Version history" icon={<History className="h-4 w-4" />} open>{(source?.versions || []).slice(0, 3).map((version, index) => <Version key={version.id} version={`v${(source?.versions?.length || 0) - index}`} note={version.note} time={new Date(version.createdAt).toLocaleString()} active={index === 0} />)}{!source?.versions?.length ? <p className="text-xs text-muted-foreground">Version history starts after the first save.</p> : null}<Button type="button" variant="ghost" size="sm" className="w-full" disabled={!source?.versions?.length} onClick={() => setHistoryOpen(true)}>View all versions</Button></Panel>
        <Panel title="Advanced settings" icon={<Settings2 className="h-4 w-4" />}><Button type="button" variant="destructive" size="sm" className="w-full" disabled={isNew} onClick={() => void remove()}><Trash2 className="mr-2 h-4 w-4" />Delete local document</Button></Panel>
      </aside>
    </div>
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}><DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0"><DialogHeader className="border-b px-6 py-4"><DialogTitle>Policy preview</DialogTitle><DialogDescription>Preview of the current unsaved editor content.</DialogDescription></DialogHeader><iframe title="Policy preview" sandbox="" srcDoc={previewDocument} className="h-[72vh] w-full bg-white" /></DialogContent></Dialog>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Version history</DialogTitle><DialogDescription>Every save creates an immutable content snapshot.</DialogDescription></DialogHeader><div className="divide-y">{(source?.versions || []).map((version, index) => <div key={version.id} className="py-4"><div className="flex items-center justify-between gap-4"><p className="font-semibold">v{(source?.versions?.length || 0) - index} · {version.note}</p><Badge variant="outline">{version.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{version.createdBy} · {new Date(version.createdAt).toLocaleString()}</p></div>)}</div></DialogContent></Dialog>
  </main>;
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!); }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-xs text-slate-600 dark:text-zinc-400">{label}</Label>{children}</div>; }
function Panel({ title, icon, children, open = false }: { title: string; icon: React.ReactNode; children?: React.ReactNode; open?: boolean }) { return <details open={open} className="group border-b border-slate-200 dark:border-zinc-800"><summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold">{icon}{title}<ChevronDown className="ml-auto h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" /></summary>{children && <div className="space-y-4 px-5 pb-5">{children}</div>}</details>; }
function Version({ version, note, time, active }: { version: string; note: string; time: string; active?: boolean }) { return <div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${active ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'}`} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className="text-xs font-semibold">{version} · {note}</span>{active && <Badge variant="secondary" className="h-5 text-[10px]">Current</Badge>}</div><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3" />{time}</p></div></div>; }
