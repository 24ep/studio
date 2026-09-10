"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudDownload, FileText, Filter, Loader2, MoreHorizontal, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PolicyDocument } from '@/lib/policy-documents';

export default function PolicyDocumentsPage() {
  const [query, setQuery] = useState('');
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>([]);
  const [appKitLoad, setAppKitLoad] = useState<{
    environment: 'development' | 'production';
    percent: number;
    message: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadDocuments = useCallback(async (showConfirmation = false) => {
    if (showConfirmation) {
      setAppKitLoad({ environment: 'production', percent: 10, message: 'Preparing request' });
    }
    try {
      const query = showConfirmation ? '?environment=production&importAppKit=true' : '';
      const response = await fetch(`/api/policy-documents${query}`, { cache: 'no-store' });
      const data = await response.json() as { documents?: PolicyDocument[]; error?: string; warning?: string };
      if (showConfirmation) {
        setAppKitLoad((current) => current ? { ...current, percent: 55, message: 'Downloading policy documents' } : null);
      }
      if (!response.ok || !data.documents) {
        throw new Error(data.error || 'Unable to load policy documents.');
      }
      setPolicyDocuments(data.documents);
      if (showConfirmation) {
        setAppKitLoad((current) => current ? { ...current, percent: 90, message: 'Saving and refreshing list' } : null);
        if (data.warning) {
          toast.error(data.warning);
        } else {
          toast.success(data.documents.length
            ? `Loaded ${data.documents.length} policy documents from AppKit.`
            : 'AppKit has no policy documents yet.');
        }
      }
    } catch (error) {
      setPolicyDocuments([]);
      toast.error(error instanceof Error ? error.message : 'Unable to load policy documents.');
    } finally {
      if (showConfirmation) {
        setAppKitLoad(null);
      }
    }
  }, []);
  const isLoadingAppKit = appKitLoad !== null;

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);
  const documents = useMemo(() => policyDocuments.filter(document => {
    const matchesQuery = `${document.title} ${document.summary} ${document.category} ${(document.tags || []).join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'all' || document.status === statusFilter);
  }), [policyDocuments, query, statusFilter]);

  return <main className="min-h-full bg-slate-50/70 px-4 py-6 text-slate-950 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1280px]">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-700 dark:text-blue-400">Knowledge & policy</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Policy documents</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">Create one trusted source, control who can read it, and publish it to employee or job portals.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void loadDocuments(true)} disabled={isLoadingAppKit}>
            {isLoadingAppKit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
            {appKitLoad ? `${appKitLoad.percent}% · ${appKitLoad.message}` : 'Load from AppKit'}
          </Button>
          <Button asChild><Link href="/policy-documents/new"><Plus className="mr-2 h-4 w-4" />New document</Link></Button>
        </div>
      </header>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title, category, or purpose" className="pl-9" /></div>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"><Filter className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Filter by status</span><select aria-label="Filter policy documents by status" className="bg-transparent outline-none" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="Draft">Draft</option><option value="In review">In review</option><option value="Published">Published</option></select></label>
      </div>
      <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-[minmax(0,1fr)_130px_150px_140px_44px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/80 max-md:hidden"><span>Document</span><span>Status</span><span>Portal</span><span>Updated</span><span /></div>
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">{documents.length === 0 ? <div className="px-4 py-12 text-center text-sm text-muted-foreground">No policy documents match the current search and status filter.</div> : documents.map(document => <Link key={document.id} href={`/policy-documents/${document.id}`} className="group grid gap-3 px-4 py-4 transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/20 md:grid-cols-[minmax(0,1fr)_130px_150px_140px_44px] md:items-center">
          <span className="flex min-w-0 gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-zinc-800"><FileText className="h-5 w-5" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{document.title}</span><span className="mt-1 block truncate text-xs text-slate-500 dark:text-zinc-400">{document.summary}</span><span className="mt-1.5 block text-[11px] font-medium text-slate-400">{document.category} · {document.owner}</span></span></span>
          <span><StatusBadge status={document.status} /></span><span className="text-xs text-slate-600 dark:text-zinc-300">{document.portals.join(', ')}</span><span className="text-xs text-slate-500">{document.updated}</span><MoreHorizontal className="hidden h-4 w-4 text-slate-400 md:block" />
        </Link>)}</div>
      </section>
    </div>
  </main>;
}

function StatusBadge({ status }: { status: string }) { const variant = status === 'Published' ? 'default' : 'secondary'; return <Badge variant={variant} className={status === 'Published' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300' : ''}>{status}</Badge>; }
