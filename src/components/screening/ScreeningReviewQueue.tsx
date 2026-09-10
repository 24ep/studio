"use client";

import * as React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Finding = {
  id: string;
  source_url: string;
  source_title?: string;
  publisher?: string;
  category: string;
  identity_confidence: number;
  allegation_status: string;
  ai_summary?: string;
  review_status: string;
};

type ScreeningCase = {
  id: string;
  identity_snapshot: { name?: string };
  created_at: string;
  use_ai: boolean;
  findings: Finding[];
};

export default function ScreeningReviewQueue() {
  const [cases, setCases] = React.useState<ScreeningCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/screening/cases?status=review_required', { credentials: 'include' });
      if (!response.ok) throw new Error('Unable to load screening reviews');
      setCases(((await response.json()) as { cases: ScreeningCase[] }).cases);
    } catch (error) {
      toastRef.current.errorWithDescription(
        'Review queue unavailable',
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: string) => {
    const response = await fetch(`/api/screening/findings/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewStatus: status }),
    });
    if (!response.ok) {
      toast.error('Review update failed');
      return;
    }
    await load();
  };

  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing screening reviews…</p>
      </div>
    );
  }

  const pendingFindings = cases.reduce(
    (count, screeningCase) => count + screeningCase.findings.filter((finding) => finding.review_status === 'pending').length,
    0,
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Human checkpoint</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">Screening review</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Verify possible identity matches before screening information is attached to a candidate.
          </p>
        </div>
        <Button className="h-9 rounded-lg" variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </header>

      <section className="grid overflow-hidden rounded-2xl border border-border/70 bg-background sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="bg-amber-50/60 p-5 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
            <ShieldCheck className="h-4 w-4" /> Reviews protect candidate fairness
          </div>
          <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-300/80">AI suggestions are never applied without a recruiter decision.</p>
        </div>
        <div className="border-t border-border/60 p-5 sm:border-l sm:border-t-0">
          <p className="text-2xl font-semibold tracking-tight">{cases.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">People to review</p>
        </div>
        <div className="border-t border-border/60 p-5 sm:border-l sm:border-t-0">
          <p className="text-2xl font-semibold tracking-tight">{pendingFindings}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Sources awaiting a decision</p>
        </div>
      </section>

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background py-16 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-3 text-sm font-semibold">Review queue is clear</h3>
          <p className="mt-1 text-sm text-muted-foreground">New possible matches will appear here for verification.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((item) => (
            <ScreeningCaseSection key={item.id} item={item} onReview={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScreeningCaseSection({ item, onReview }: { item: ScreeningCase; onReview: (id: string, status: string) => Promise<void> }) {
  const pending = item.findings.filter((finding) => finding.review_status === 'pending');

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_1px_2px_hsl(var(--foreground)/.03)]">
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
            <UserRoundCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{item.identity_snapshot?.name || 'Screening subject'}</h3>
            <p className="text-xs text-muted-foreground">
              Added {new Date(item.created_at).toLocaleString()} · {pending.length} {pending.length === 1 ? 'source' : 'sources'}
            </p>
          </div>
        </div>
        <Badge className="w-fit rounded-full border-0 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Decision required
        </Badge>
      </div>

      <div className="divide-y divide-border/60">
        {pending.map((finding) => (
          <FindingRow key={finding.id} finding={finding} onReview={onReview} />
        ))}
      </div>
    </section>
  );
}

function FindingRow({ finding, onReview }: { finding: Finding; onReview: (id: string, status: string) => Promise<void> }) {
  const confidence = Math.round(Number(finding.identity_confidence) * 100);

  return (
    <article className="p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium text-foreground">{finding.source_title || formatLabel(finding.category)}</h4>
                <a className="text-muted-foreground transition-colors hover:text-foreground" href={finding.source_url} target="_blank" rel="noreferrer" aria-label="Open original source">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {finding.publisher || 'Public source'} · {formatLabel(finding.category)} · {formatLabel(finding.allegation_status)}
              </p>
              {finding.ai_summary && <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/85">{finding.ai_summary}</p>}
            </div>
          </div>
        </div>

        <div className="min-w-40 rounded-xl bg-muted/35 px-4 py-3 lg:text-right">
          <p className="text-xl font-semibold tracking-tight">{confidence}%</p>
          <p className="text-xs text-muted-foreground">Identity confidence</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border/50 pt-4">
        <Button size="sm" variant="ghost" onClick={() => void onReview(finding.id, 'wrong_person')}>Wrong person</Button>
        <Button size="sm" variant="ghost" onClick={() => void onReview(finding.id, 'irrelevant')}>Not relevant</Button>
        <Button size="sm" variant="outline" onClick={() => void onReview(finding.id, 'disputed')}>Mark disputed</Button>
        <Button size="sm" onClick={() => void onReview(finding.id, 'confirmed')}>Confirm match</Button>
      </div>
    </article>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
