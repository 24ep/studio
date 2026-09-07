"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileSignature,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  JobOfferCreateDialog,
  emptyOfferForm,
  type ApplicantOption,
  type PositionOption,
} from './JobOfferCreateDialog';

interface OfferRow {
  id: string;
  recipient_name: string;
  recipient_email: string;
  job_title: string;
  salary_amount: string | null;
  currency: string;
  start_date: string | null;
  status: string;
  sent_at: string | null;
  accepted_at: string | null;
  signed_name: string | null;
  signature_hash: string | null;
}

type OfferFilter = 'all' | 'draft' | 'sent' | 'accepted';

const offerFilters: Array<{ value: OfferFilter; label: string }> = [
  { value: 'all', label: 'All offers' },
  { value: 'draft', label: 'Drafts' },
  { value: 'sent', label: 'Awaiting reply' },
  { value: 'accepted', label: 'Accepted' },
];

const offerFilterDetails = {
  all: {
    eyebrow: 'Complete pipeline',
    title: 'Every offer in motion',
    description: 'Review the full journey from first draft through final signature.',
    emptyTitle: 'Your offer desk is ready',
    emptyDescription: 'Create the first offer to begin tracking delivery and candidate acceptance.',
    icon: FileSignature,
    accentClass: 'bg-primary/[0.08] text-primary',
  },
  draft: {
    eyebrow: 'Needs your review',
    title: 'Draft offers',
    description: 'Confirm compensation, start dates, and candidate details before sending.',
    emptyTitle: 'No drafts waiting',
    emptyDescription: 'Every prepared offer has been sent. Create a new one when the next finalist is ready.',
    icon: BriefcaseBusiness,
    accentClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  sent: {
    eyebrow: 'Candidate action',
    title: 'Waiting for a response',
    description: 'Keep an eye on delivered offers and follow up when the timing is right.',
    emptyTitle: 'No replies outstanding',
    emptyDescription: 'There are no sent offers waiting for candidate action right now.',
    icon: Clock3,
    accentClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  },
  accepted: {
    eyebrow: 'Completed',
    title: 'Accepted offers',
    description: 'A clean record of candidates who signed and are ready for onboarding.',
    emptyTitle: 'No accepted offers yet',
    emptyDescription: 'Signed offers will collect here as candidates complete their acceptance.',
    icon: CheckCircle2,
    accentClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
} satisfies Record<OfferFilter, {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: typeof FileSignature;
  accentClass: string;
}>;

function getStatusMeta(status: string) {
  switch (status.toLowerCase()) {
    case 'accepted':
      return {
        label: 'Accepted',
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
      };
    case 'sent':
      return {
        label: 'Awaiting reply',
        icon: Clock3,
        className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
      };
    default:
      return {
        label: 'Draft',
        icon: FileSignature,
        className: 'border-border bg-muted/60 text-muted-foreground',
      };
  }
}

function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(undefined, options ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatSalary(amount: string | null, currency: string) {
  if (!amount) return 'Salary not set';
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 'Salary not set';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'THB',
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString()} ${currency}`.trim();
  }
}

export function JobOffersPageClient() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [applicants, setApplicants] = useState<ApplicantOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [form, setForm] = useState(emptyOfferForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OfferFilter>('all');
  const [query, setQuery] = useState('');

  const selectedApplicant = useMemo(
    () => applicants.find((applicant) => applicant.id === form.applicantId),
    [applicants, form.applicantId],
  );

  const counts = useMemo(() => ({
    all: offers.length,
    draft: offers.filter((offer) => offer.status.toLowerCase() === 'draft').length,
    sent: offers.filter((offer) => offer.status.toLowerCase() === 'sent').length,
    accepted: offers.filter((offer) => offer.status.toLowerCase() === 'accepted').length,
  }), [offers]);

  const visibleOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return offers.filter((offer) => {
      const matchesFilter = activeFilter === 'all' || offer.status.toLowerCase() === activeFilter;
      const matchesQuery = !normalizedQuery || [offer.recipient_name, offer.recipient_email, offer.job_title]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, offers, query]);

  const activeFilterDetails = offerFilterDetails[activeFilter];
  const ActiveFilterIcon = activeFilterDetails.icon;

  async function loadOffers() {
    setLoading(true);
    try {
      const response = await fetch('/api/job-offers');
      if (!response.ok) throw new Error('Failed to load job offers');
      const data = await response.json();
      setOffers(Array.isArray(data.offers) ? data.offers : []);
      setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
      setPositions(Array.isArray(data.positions) ? data.positions : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load job offers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOffers();
  }, []);

  useEffect(() => {
    if (!selectedApplicant) return;
    const applicantPosition = positions.find((position) => position.id === selectedApplicant.positionId);
    setForm((current) => ({
      ...current,
      recipientName: selectedApplicant.name,
      recipientEmail: selectedApplicant.email,
      positionId: selectedApplicant.positionId || current.positionId,
      jobTitle: applicantPosition?.title || current.jobTitle,
    }));
  }, [positions, selectedApplicant]);

  async function createOffer(sendNow = false) {
    setSaving(true);
    try {
      const response = await fetch('/api/job-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: form.applicantId || null,
          positionId: form.positionId || null,
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
          jobTitle: form.jobTitle,
          salaryAmount: form.salaryAmount ? Number(form.salaryAmount) : null,
          currency: form.currency,
          startDate: form.startDate || null,
          sendNow,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to create offer');
      toast.success(sendNow ? 'Offer created and sent' : 'Offer created');
      setOpen(false);
      setForm(emptyOfferForm);
      await loadOffers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create offer');
    } finally {
      setSaving(false);
    }
  }

  async function sendOffer(id: string) {
    setSendingId(id);
    try {
      const response = await fetch(`/api/job-offers/${id}/send`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to send offer');
      toast.success('Offer letter sent');
      await loadOffers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send offer');
    } finally {
      setSendingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--app-page-background))] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
        <header className="relative overflow-hidden rounded-2xl border bg-card px-5 py-6 sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/[0.06]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="h-px w-7 bg-primary/60" />
                Hiring workspace
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">Offer desk</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Move finalists across the finish line. Prepare, send, and track every offer from one focused queue.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" onClick={loadOffers} disabled={loading} className="h-10 px-4">
                <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                Refresh
              </Button>
              <Button onClick={() => setOpen(true)} className="h-10 px-4">
                <Plus className="mr-2 h-4 w-4" />
                Create offer
              </Button>
            </div>
          </div>
        </header>

        <section aria-label="Offer summary" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
          {[
            { label: 'All offers', value: counts.all, note: 'Total records', icon: FileSignature, filter: 'all' as OfferFilter },
            { label: 'Drafts', value: counts.draft, note: 'Ready to review', icon: BriefcaseBusiness, filter: 'draft' as OfferFilter },
            { label: 'Awaiting reply', value: counts.sent, note: 'Candidate action', icon: Clock3, filter: 'sent' as OfferFilter },
            { label: 'Accepted', value: counts.accepted, note: 'Successfully signed', icon: CheckCircle2, filter: 'accepted' as OfferFilter },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveFilter(item.filter)}
              aria-pressed={activeFilter === item.filter}
              className={cn(
                'group relative bg-card px-4 py-4 text-left transition-colors hover:bg-muted/35 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5',
                activeFilter === item.filter && 'bg-primary/[0.055]',
              )}
            >
              <span className={cn(
                'absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 motion-reduce:transition-none',
                activeFilter === item.filter && 'scale-x-100',
              )} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{item.value}</div>
                  <div className="mt-1 hidden text-xs text-muted-foreground sm:block">{item.note}</div>
                </div>
                <item.icon className={cn('mt-0.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary', activeFilter === item.filter && 'text-primary')} />
              </div>
            </button>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-col gap-4 border-b px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1 overflow-x-auto pb-1 lg:pb-0" aria-label="Filter offers">
              {offerFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  aria-pressed={activeFilter === filter.value}
                  className={cn(
                    'whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    activeFilter === filter.value && 'bg-foreground text-background hover:bg-foreground hover:text-background',
                  )}
                >
                  {filter.label}
                  <span className={cn('ml-2 text-[10px] opacity-60', activeFilter === filter.value && 'opacity-75')}>{counts[filter.value]}</span>
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search offers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, role, or email"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-b bg-muted/[0.16] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', activeFilterDetails.accentClass)}>
                <ActiveFilterIcon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {activeFilterDetails.eyebrow}
                </div>
                <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{activeFilterDetails.title}</h2>
                <p className="mt-0.5 max-w-2xl text-xs leading-5 text-muted-foreground">{activeFilterDetails.description}</p>
              </div>
            </div>
            <div className="shrink-0 pl-[54px] text-xs font-medium text-muted-foreground sm:pl-0">
              {visibleOffers.length} {visibleOffers.length === 1 ? 'offer' : 'offers'}
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(220px,1.35fr)_minmax(190px,1fr)_170px_160px_130px] gap-4 border-b bg-muted/25 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
            <span>Candidate</span>
            <span>Offer</span>
            <span>Timeline</span>
            <span>Status</span>
            <span className="text-right">Next step</span>
          </div>

          {loading ? (
            <div className="space-y-px bg-border" aria-live="polite">
              {[0, 1, 2].map((item) => (
                <div key={item} className="grid animate-pulse gap-4 bg-card px-5 py-5 lg:grid-cols-[minmax(220px,1.35fr)_minmax(190px,1fr)_170px_160px_130px]">
                  <div className="h-9 rounded bg-muted" />
                  <div className="h-9 rounded bg-muted" />
                  <div className="h-9 rounded bg-muted" />
                  <div className="h-7 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : visibleOffers.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
              <div className={cn('mb-5 flex h-14 w-14 items-center justify-center rounded-full', query ? 'bg-primary/[0.07] text-primary' : activeFilterDetails.accentClass)}>
                {query ? <Search className="h-6 w-6" /> : <ActiveFilterIcon className="h-6 w-6" />}
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                {query ? 'No matching offers' : activeFilterDetails.emptyTitle}
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                {query ? 'Try a different name, role, or email address.' : activeFilterDetails.emptyDescription}
              </p>
              {!query && (activeFilter === 'all' || activeFilter === 'draft') && (
                <Button onClick={() => setOpen(true)} className="mt-5">
                  <Plus className="mr-2 h-4 w-4" />
                  Create offer
                </Button>
              )}
              {query && (
                <Button variant="outline" onClick={() => setQuery('')} className="mt-5">Clear search</Button>
              )}
            </div>
          ) : visibleOffers.map((offer) => {
            const status = getStatusMeta(offer.status);
            const StatusIcon = status.icon;
            return (
              <article key={offer.id} className="group grid gap-4 border-b px-4 py-5 transition-colors last:border-b-0 hover:bg-muted/20 sm:px-5 lg:grid-cols-[minmax(220px,1.35fr)_minmax(190px,1fr)_170px_160px_130px] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-sm font-semibold text-primary">
                    {offer.recipient_name.trim().charAt(0).toUpperCase() || <UserRound className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{offer.recipient_name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{offer.recipient_email}</div>
                  </div>
                </div>

                <div className="min-w-0 pl-[52px] lg:pl-0">
                  <div className="truncate text-sm font-medium">{offer.job_title}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5" />
                    <span className="truncate">{formatSalary(offer.salary_amount, offer.currency)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-y py-3 text-xs lg:block lg:border-0 lg:py-0">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(offer.start_date)}
                  </div>
                  <div className="mt-0 text-muted-foreground lg:mt-1 lg:pl-5">
                    {offer.accepted_at ? `Signed ${formatDate(offer.accepted_at, { day: 'numeric', month: 'short' })}` : offer.sent_at ? `Sent ${formatDate(offer.sent_at, { day: 'numeric', month: 'short' })}` : 'Not sent yet'}
                  </div>
                </div>

                <div>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', status.className)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                  {offer.signed_name && <div className="mt-1.5 truncate text-xs text-muted-foreground">by {offer.signed_name}</div>}
                </div>

                <div className="flex justify-end">
                  {offer.status.toLowerCase() === 'accepted' ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Check className="h-4 w-4" /> Complete
                    </div>
                  ) : (
                    <Button
                      variant={offer.status.toLowerCase() === 'draft' ? 'default' : 'outline'}
                      size="sm"
                      disabled={sendingId === offer.id}
                      onClick={() => sendOffer(offer.id)}
                      className="w-full sm:w-auto"
                    >
                      {sendingId === offer.id ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                      {offer.status.toLowerCase() === 'sent' ? 'Resend' : 'Send offer'}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
          {visibleOffers.length > 0 && !loading && (
            <div className="flex items-center justify-between bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
              <span>Showing {visibleOffers.length} of {offers.length} offers</span>
              <span className="hidden items-center gap-1 sm:flex">Updated just now <ArrowUpRight className="h-3 w-3" /></span>
            </div>
          )}
        </section>
      </div>

      <JobOfferCreateDialog
        applicants={applicants}
        form={form}
        onCreate={createOffer}
        onFormChange={setForm}
        onOpenChange={setOpen}
        open={open}
        positions={positions}
        saving={saving}
      />
    </main>
  );
}
