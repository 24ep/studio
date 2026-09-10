"use client";

import * as React from 'react';
import { ChartBarIcon, LockClosedIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { HrisEmptyState, HrisStatusBadge, HrisWorkspaceHeader } from '@/components/hris/HrisWorkspacePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SurveyRow {
  id: string;
  title: string;
  type: string;
  status: string;
  privacyMode: string;
  anonymousThreshold: number;
  updatedAt: string;
}

interface Dashboard {
  metrics: Record<string, number | null>;
  capabilities: { canManage: boolean; canAnalyze: boolean; canExport: boolean };
}

interface SurveyTemplate { id: string; name: string; description?: string | null; category: string; }

export function EngagementWorkspace() {
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [surveys, setSurveys] = React.useState<SurveyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [privacyMode, setPrivacyMode] = React.useState('anonymous');
  const [threshold, setThreshold] = React.useState(5);
  const [templates, setTemplates] = React.useState<SurveyTemplate[]>([]);
  const [templateId, setTemplateId] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardResponse, listResponse, templateResponse] = await Promise.all([
        fetch('/api/surveys?view=dashboard', { cache: 'no-store' }),
        fetch('/api/surveys?limit=100', { cache: 'no-store' }),
        fetch('/api/surveys?view=templates', { cache: 'no-store' }),
      ]);
      const dashboardBody = await dashboardResponse.json();
      const listBody = await listResponse.json();
      if (!dashboardResponse.ok) throw new Error(dashboardBody.message || 'Unable to load engagement dashboard.');
      if (!listResponse.ok) throw new Error(listBody.message || 'Unable to load surveys.');
      setDashboard(dashboardBody);
      setSurveys(listBody.surveys || []);
      if (templateResponse.ok) setTemplates((await templateResponse.json()).templates || []);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to load engagement workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  async function createSurvey() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          internalName: title,
          type: 'engagement',
          privacyMode,
          estimatedMinutes: 5,
          language: 'en',
          additionalLanguages: [],
          tags: ['engagement'],
          isRequired: false,
          allowDraft: true,
          allowEditAfterSubmit: false,
          anonymousThreshold: threshold,
          resultsVisibility: 'owner_after_close',
          timezone: 'Asia/Bangkok',
          templateId: templateId || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) return toast.error(body.message || 'Unable to create survey.');
      toast.success('Engagement survey created');
      setCreating(false);
      setTitle('');
      setTemplateId('');
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  const metrics = dashboard?.metrics || {};

  return (
    <main className="min-h-screen bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl border border-border bg-background p-5">
          <HrisWorkspaceHeader
            eyebrow="Engagement"
            title="Employee listening and action plans"
            description="Create engagement and lifecycle surveys with protected anonymous reporting."
            leading={<ChartBarIcon className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />}
            action={dashboard?.capabilities.canManage ? <Button className="min-h-11" onClick={() => setCreating(true)}><PlusIcon className="mr-2 h-4 w-4" /> New survey</Button> : undefined}
          />
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Survey metrics">
          {['drafts', 'scheduled', 'active', 'closed', 'responseRate'].map(key => (
            <div key={key} className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key === 'responseRate' ? 'Response rate' : key}</p>
              <p className="mt-2 text-2xl font-bold">{metrics[key] ?? '—'}{key === 'responseRate' && metrics[key] !== null && metrics[key] !== undefined ? '%' : ''}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border p-4"><h2 className="font-semibold">Survey portfolio</h2><p className="text-sm text-muted-foreground">Anonymous segments below their configured threshold remain suppressed by the analytics API.</p></div>
          {loading ? <div className="p-10 text-center text-sm text-muted-foreground" role="status">Loading surveys…</div> : surveys.length === 0 ? <HrisEmptyState title="No surveys yet" description="Create a draft engagement or lifecycle survey when you are ready to listen to employees." action={dashboard?.capabilities.canManage ? <Button variant="outline" onClick={() => setCreating(true)}>Create first survey</Button> : undefined} /> : (
            <div className="divide-y divide-border">
              {surveys.map(survey => (
                <article key={survey.id} className="group flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                  <div><h3 className="font-semibold">{survey.title}</h3><p className="text-xs text-muted-foreground">Updated {new Date(survey.updatedAt).toLocaleDateString()}</p></div>
                  <div className="flex flex-wrap items-center gap-2">
                    {survey.privacyMode === 'anonymous' && <Badge variant="secondary"><LockClosedIcon className="mr-1 h-3 w-3" /> Threshold {survey.anonymousThreshold}</Badge>}
                    <Badge variant="outline" className="capitalize">{survey.type}</Badge>
                    <HrisStatusBadge value={survey.status} />
                    <Button asChild variant="ghost" size="sm"><Link href={`/workforce/engagement/${survey.id}`}>Open studio<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link></Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0" dialogId="new-engagement-survey-dialog">
          <form
            className="flex min-h-0 w-full flex-col overflow-hidden"
            onSubmit={event => {
              event.preventDefault();
              void createSurvey();
            }}
          >
            <DialogHeader className="border-b border-border/60 px-5 py-5 pr-14 text-left sm:px-6">
              <DialogTitle>New engagement survey</DialogTitle>
              <DialogDescription>Create a draft now. You can add questions and choose the audience afterward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
              <div>
                <Label>Start from</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setTemplateId('')} className={`rounded-lg border p-3 text-left ${!templateId ? 'border-primary bg-primary/5' : 'border-border'}`}><span className="text-sm font-semibold">Blank survey</span><span className="mt-1 block text-xs text-muted-foreground">Build every question yourself.</span></button>
                  {templates.map(template => <button key={template.id} type="button" onClick={() => { setTemplateId(template.id); if (!title) setTitle(template.name); }} className={`rounded-lg border p-3 text-left ${templateId === template.id ? 'border-primary bg-primary/5' : 'border-border'}`}><span className="text-sm font-semibold">{template.name}</span><span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{template.description}</span></button>)}
                </div>
              </div>
              <div>
                <Label htmlFor="survey-title">Title</Label>
                <Input
                  id="survey-title"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  className="mt-1.5"
                  placeholder="e.g. Q3 employee engagement survey"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="survey-privacy">Privacy</Label>
                <select id="survey-privacy" value={privacyMode} onChange={event => setPrivacyMode(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="anonymous">Anonymous</option>
                  <option value="confidential">Confidential</option>
                  <option value="identified">Identified</option>
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">Anonymous responses protect respondent identity and suppress small-group reporting.</p>
              </div>
              {privacyMode === 'anonymous' && (
                <div>
                  <Label htmlFor="survey-threshold">Minimum reportable responses</Label>
                  <Input id="survey-threshold" type="number" min={3} max={100} value={threshold} onChange={event => setThreshold(Number(event.target.value))} className="mt-1.5" />
                </div>
              )}
            </div>
            <DialogFooter className="border-t border-border/60 px-5 py-4 sm:px-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>Close</Button>
              </DialogClose>
              <Button type="submit" disabled={title.trim().length < 2 || submitting}>{submitting ? 'Creating…' : 'Create draft'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
