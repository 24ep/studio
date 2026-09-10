"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  Inbox,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Paperclip,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useServiceDeskCategories } from '@/hooks/use-service-desk-categories';
import { cn } from '@/lib/utils';
import {
  canHrAct,
  canRequesterReply,
  canRequesterWithdraw,
  isTerminalTicketStatus,
  type ServiceDeskAction,
} from '@/lib/service-desk-contract';
import { PrivacySupportShell, StatusPill } from './PrivacySupportShell';
import {
  avatarTone,
  ConversationMessage,
  formatDate,
  formatListDate,
  initials,
  ServiceDeskTicketList,
  statusTone,
  type StatusFilter,
  type SupportTicket,
} from './ServiceDeskParts';

type ApiPayload = {
  message?: string;
  id?: string;
  requestNumber?: string;
  requests?: SupportTicket[];
  support?: SupportTicket[];
};

type PendingConfirmation = 'close' | 'withdraw' | null;

async function readPayload(response: Response): Promise<ApiPayload> {
  return response.json().catch(() => ({})) as Promise<ApiPayload>;
}

export function ServiceDeskPage({
  initialTicketId = null,
}: {
  initialTicketId?: string | null;
}) {
  const { locale, t } = useLocalization();
  const serviceDeskCategories = useServiceDeskCategories();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showTicketHistory, setShowTicketHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isHr, setIsHr] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null);
  const loadController = useRef<AbortController | null>(null);

  const load = useCallback(async (preferredId?: string) => {
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    setLoading(true);
    try {
      const adminResponse = await fetch('/api/privacy-support/admin/requests', {
        cache: 'no-store',
        signal: controller.signal,
      });
      let data = await readPayload(adminResponse);
      let nextTickets: SupportTicket[];
      let nextIsHr: boolean;

      if (adminResponse.status === 403) {
        const employeeResponse = await fetch('/api/privacy-support/support', {
          cache: 'no-store',
          signal: controller.signal,
        });
        data = await readPayload(employeeResponse);
        if (!employeeResponse.ok) throw new Error(data.message || t('serviceDesk.error.load', 'Unable to load support tickets.'));
        nextIsHr = false;
        nextTickets = (data.requests || []).map(ticket => ({
          ...ticket,
          requester: t('serviceDesk.you', 'You'),
          description: ticket.description || '',
          priority: ticket.priority || 'normal',
          activities: ticket.activities || [],
        }));
      } else {
        if (!adminResponse.ok) throw new Error(data.message || t('serviceDesk.error.load', 'Unable to load support tickets.'));
        nextIsHr = true;
        nextTickets = (data.support || []).map(ticket => ({ ...ticket, activities: ticket.activities || [] }));
      }

      if (controller.signal.aborted) return;
      setIsHr(nextIsHr);
      setTickets(nextTickets);
      setActiveId(current => {
        const requested = preferredId || initialTicketId;
        if (requested && nextTickets.some(ticket => ticket.id === requested)) return requested;
        if (current && nextTickets.some(ticket => ticket.id === current)) return current;
        return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
          ? nextTickets[0]?.id || null
          : null;
      });
      setError('');
    } catch (loadError) {
      if (controller.signal.aborted) return;
      setError(loadError instanceof Error ? loadError.message : t('serviceDesk.error.load', 'Unable to load support tickets.'));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [initialTicketId, t]);

  useEffect(() => {
    void load();
    return () => loadController.current?.abort();
  }, [load]);

  useEffect(() => {
    setPendingConfirmation(null);
  }, [activeId]);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase(locale);
    return tickets.filter(ticket => {
      if (statusFilter === 'open' && isTerminalTicketStatus(ticket.status)) return false;
      if (statusFilter === 'closed' && !isTerminalTicketStatus(ticket.status)) return false;
      if (!search) return true;
      return [ticket.requestNumber, ticket.requester, ticket.requesterEmail, ticket.subject, ticket.category]
        .some(value => value?.toLocaleLowerCase(locale).includes(search));
    });
  }, [locale, query, statusFilter, tickets]);

  const active = tickets.find(ticket => ticket.id === activeId) || null;
  const requesterHistory = useMemo(() => {
    if (!active) return [];
    return tickets
      .filter(ticket => {
        if (!isHr && active.requester === t('serviceDesk.you', 'You')) return true;
        if (active.requesterId && ticket.requesterId) return active.requesterId === ticket.requesterId;
        if (active.requesterEmail && ticket.requesterEmail) return active.requesterEmail === ticket.requesterEmail;
        return active.requester === ticket.requester;
      })
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [active, isHr, t, tickets]);
  const openCount = tickets.filter(ticket => !isTerminalTicketStatus(ticket.status)).length;
  const closedCount = tickets.filter(ticket => isTerminalTicketStatus(ticket.status)).length;
  const isHistoryMode = statusFilter === 'closed';

  function closeWorkspace() {
    setActiveId(null);
    setShowTicketHistory(false);
    setPendingConfirmation(null);
  }

  function openTicketHistory() {
    setShowTicketHistory(true);
    setPendingConfirmation(null);
  }

  async function updateTicket(action: ServiceDeskAction, message?: string) {
    if (!active) return false;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(isHr ? '/api/privacy-support/admin/requests' : '/api/privacy-support/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: active.id, action, message }),
      });
      const data = await readPayload(response);
      if (!response.ok) {
        setError(data.message || t('serviceDesk.error.update', 'Unable to update this ticket.'));
        return false;
      }
      setPendingConfirmation(null);
      setNotice(action === 'reply'
        ? t('serviceDesk.notice.reply', 'Your reply was added to the ticket history.')
        : action === 'close'
          ? t('serviceDesk.notice.closed', 'The ticket was closed.')
          : t('serviceDesk.notice.withdrawn', 'The request was withdrawn.'));
      await load(active.id);
      return true;
    } catch {
      setError(t('serviceDesk.error.network', 'The service desk could not be reached. Check your connection and try again.'));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get('message') || '').trim();
    if (!message) return;
    if (await updateTicket('reply', message)) form.reset();
  }

  const canReply = active ? (isHr ? canHrAct(active.status) : canRequesterReply(active.status)) : false;
  const canWithdraw = Boolean(active && !isHr && canRequesterWithdraw(active.status));
  const canClose = Boolean(active && isHr && canHrAct(active.status));
  const displayStatus = (status: string) => t(
    `serviceDesk.status.${status}`,
    status === 'in_review'
      ? 'In progress'
      : status === 'action_required'
        ? (isHr ? 'Waiting on employee' : 'Action required')
        : status === 'submitted'
          ? (isHr ? 'Waiting on HR' : 'Submitted')
          : status.replaceAll('_', ' '),
  );
  const categoryLabel = (category: string) => t(
    `serviceDesk.category.${category}`,
    serviceDeskCategories.find(item => item.key === category)?.label || category.replaceAll('_', ' '),
  );
  const selectTicket = (ticketId: string) => {
    setShowTicketHistory(false);
    setActiveId(ticketId);
  };

  return (
    <PrivacySupportShell
      eyebrow={t('serviceDesk.eyebrow', 'Support operations')}
      title={t('serviceDesk.title', 'Service Desk')}
      description={t('serviceDesk.description', 'Follow employee support tickets and retain a permanent activity history for every conversation.')}
      hideHeader
      fullPage
    >
      <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,24%)_minmax(0,1fr)]">
          <ServiceDeskTicketList
            activeId={activeId}
            categoryLabel={categoryLabel}
            closedCount={closedCount}
            displayStatus={displayStatus}
            error={error}
            filtered={filtered}
            hasActiveTicket={Boolean(active)}
            isHistoryMode={isHistoryMode}
            isHr={isHr}
            loading={loading}
            locale={locale}
            onQueryChange={setQuery}
            onRetry={() => void load()}
            onSelectTicket={selectTicket}
            onStatusFilterChange={setStatusFilter}
            openCount={openCount}
            query={query}
            statusFilter={statusFilter}
            t={t}
            ticketCount={tickets.length}
          />

          <div className={cn(
            'min-h-0 min-w-0 flex-col overflow-hidden bg-card lg:flex',
            active ? 'flex' : 'hidden',
          )}>
            <div className="sr-only" aria-live="polite">{notice}</div>
            {error && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/30 dark:text-red-200">
                <span>{error}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => void load(active?.id)}><RefreshCw className="me-1.5 h-4 w-4" />{t('common.retry', 'Try again')}</Button>
              </div>
            )}
            {notice && !error && <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200">{notice}</div>}
            {!active && !loading && (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">{t('serviceDesk.selectTicket', 'Select a ticket')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('serviceDesk.selectTicketHint', 'Choose a ticket to review its complete history.')}</p>
              </div>
            )}
            {active && <>
              <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
                <button type="button" onClick={closeWorkspace} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('serviceDesk.backToTickets', 'Back to tickets')}
                </button>
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar size="lg" className="rounded-full"><AvatarFallback className={cn('rounded-full text-xs font-semibold', avatarTone(active.requester))}>{initials(active.requester)}</AvatarFallback></Avatar>
                  <div className="min-w-0 border-e border-border pe-5">
                    <p className="truncate text-sm font-semibold">{active.requester}</p>
                    {active.requesterEmail && <p className="mt-0.5 max-w-48 truncate text-[11px] text-muted-foreground">{active.requesterEmail}</p>}
                  </div>
                  <div className="min-w-0 flex-1 border-e border-border pe-5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2"><h2 className="min-w-0 break-words font-semibold">{active.subject}</h2><StatusPill tone={statusTone(active.status)}>{displayStatus(active.status)}</StatusPill></div>
                    <p className="mt-1 break-words text-xs text-muted-foreground">{active.requestNumber} · {categoryLabel(active.category)}</p>
                  </div>
                  <div className="min-w-24"><p className="text-[10px] text-muted-foreground">{t('serviceDesk.submittedLabel', 'Submitted')}</p><p className="mt-1 text-xs font-medium">{formatListDate(active.submittedAt, locale)}</p></div>
                  <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => showTicketHistory ? setShowTicketHistory(false) : openTicketHistory()}>
                    {showTicketHistory ? <MessageSquareText className="me-1.5 h-4 w-4" /> : <History className="me-1.5 h-4 w-4" />}
                    {showTicketHistory ? t('serviceDesk.backToConversation', 'Back to conversation') : t('serviceDesk.ticketHistory', 'Ticket history')}
                  </Button>
                </div>
              </header>

              {pendingConfirmation && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <p>{pendingConfirmation === 'close' ? t('serviceDesk.confirmClose', 'Close this ticket? Its history will remain available.') : t('serviceDesk.confirmWithdraw', 'Withdraw this request? HR will no longer act on it.')}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setPendingConfirmation(null)} disabled={saving}>{t('common.cancel', 'Cancel')}</Button>
                    <Button size="sm" onClick={() => void updateTicket(pendingConfirmation)} disabled={saving}>{saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{t('common.confirm', 'Confirm')}</Button>
                  </div>
                </div>
              )}

              {!showTicketHistory && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-emerald-50/60 px-5 py-3 dark:bg-emerald-950/20 sm:px-6">
                <p className="text-xs text-muted-foreground"><LockKeyhole className="me-2 inline h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" /><span className="font-semibold text-emerald-800 dark:text-emerald-200">{t('serviceDesk.privateConversation', 'Private conversation')}</span><span className="ms-2">{t('serviceDesk.historyNotice', 'Replies and status changes are saved permanently in the employee ticket history.')}</span></p>
                {canClose && <Button variant="outline" size="sm" onClick={() => setPendingConfirmation('close')} disabled={saving}><CheckCircle2 className="me-2 h-4 w-4" />{t('serviceDesk.close', 'Close ticket')}</Button>}
                {canWithdraw && <Button variant="outline" size="sm" onClick={() => setPendingConfirmation('withdraw')} disabled={saving}><XCircle className="me-2 h-4 w-4" />{t('serviceDesk.withdraw', 'Withdraw request')}</Button>}
              </div>}
              {showTicketHistory ? (
                <section className="min-h-0 flex-1 overflow-y-auto bg-background" aria-labelledby="ticket-history-heading">
                  <div className="border-b border-border px-5 py-6 sm:px-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{active.requester}</p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 id="ticket-history-heading" className="text-xl font-semibold tracking-[-0.025em]">{t('serviceDesk.ticketHistory', 'Ticket history')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('serviceDesk.ticketHistoryDescription', 'Each new conversation remains one ticket until it is closed.')}</p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{t('serviceDesk.ticketCount', '{count} tickets').replace('{count}', String(requesterHistory.length))}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-border border-b border-border">
                    {requesterHistory.map(ticket => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => selectTicket(ticket.id)}
                        className="grid w-full gap-3 px-5 py-5 text-start transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:px-8"
                      >
                        <span className="min-w-0">
                          <span className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="break-words text-sm font-semibold">{ticket.subject}</span>
                            {ticket.id === active.id && <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">{t('serviceDesk.currentTicket', 'Current ticket')}</span>}
                          </span>
                          <span className="mt-1.5 block text-xs text-muted-foreground">{ticket.requestNumber} · {categoryLabel(ticket.category)}</span>
                          <span className="mt-2 line-clamp-2 block text-xs leading-5 text-foreground/70">{ticket.description}</span>
                        </span>
                        <span className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                          <StatusPill tone={statusTone(ticket.status)}>{displayStatus(ticket.status)}</StatusPill>
                          <span className="text-[10px] text-muted-foreground">{formatDate(ticket.updatedAt, locale)}</span>
                        </span>
                      </button>
                    ))}
                    {requesterHistory.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground sm:px-8">{t('serviceDesk.noTicketHistory', 'No ticket history is available for this employee.')}</p>}
                  </div>
                </section>
              ) : <>
                <div className="min-h-0 flex-1 overflow-y-auto bg-background px-5 sm:px-8">
                  <div className="mx-auto max-w-5xl space-y-6 py-6">
                    <ConversationMessage
                      actor={active.requester}
                      email={active.requesterEmail}
                      message={active.description}
                      createdAt={active.submittedAt}
                      locale={locale}
                      requesterMessage
                    />
                    {active.activities.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t('serviceDesk.noActivity', 'No activity has been recorded yet.')}</p>}
                    {active.activities.map((activity, index) => {
                      const actor = activity.actor || (activity.action === 'reply' ? t('serviceDesk.participant', 'Ticket participant') : t('serviceDesk.system', 'System'));
                      const splitAfter = activity.action === 'closed' || activity.action === 'withdrawn';
                      const requesterMessage = activity.actorId
                        ? activity.actorId === active.requesterId
                        : actor.replace(/\s*\(HR\)\s*$/i, '') === active.requester;
                      return (
                        <div key={activity.id || `${activity.createdAt}-${index}`} className="space-y-4">
                          {activity.action === 'reply' && activity.message ? (
                            <ConversationMessage actor={actor} message={activity.message} createdAt={activity.createdAt} locale={locale} requesterMessage={requesterMessage} />
                          ) : (
                            <div className="flex items-center gap-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                              <span className="h-px flex-1 bg-border" />
                              <span>{t(`serviceDesk.activity.${activity.action}`, activity.action.replaceAll('_', ' '))} · {formatDate(activity.createdAt, locale)}</span>
                              <span className="h-px flex-1 bg-border" />
                            </div>
                          )}
                          {splitAfter && (
                            <div className="pt-1">
                              <div className="relative mx-auto flex max-w-4xl items-center gap-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                                <span className="h-px flex-1 bg-border"></span>
                                <span className="px-2 text-center">{t('serviceDesk.conversationSplitWidget', 'This conversation ended. Start a new request from the support widget.')}</span>
                                <span className="h-px flex-1 bg-border"></span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form key={active.id} onSubmit={sendReply} className="border-t border-border bg-card px-3 py-2 sm:px-5">
                  <div className="relative w-full">
                    <button type="button" className="absolute start-1.5 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('serviceDesk.attach', 'Attach file')}>
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <Textarea
                      name="message"
                      aria-label={t('serviceDesk.replyLabel', 'Reply to this ticket')}
                      className="h-11 min-h-11 resize-none rounded-xl border border-input bg-background py-2.5 pe-12 ps-12 shadow-none"
                      maxLength={3000}
                      required
                      disabled={saving || !canReply}
                      placeholder={canReply ? (isHr ? t('serviceDesk.hrReplyPlaceholder', 'Write an HR reply…') : t('serviceDesk.employeeReplyPlaceholder', 'Add information or reply to HR…')) : t('serviceDesk.terminalPlaceholder', 'This ticket is read-only.')}
                    />
                    <Button type="submit" size="icon" className="absolute inset-y-0 end-1.5 z-10 my-auto h-8 w-8 rounded-md transition-none motion-safe:hover:translate-y-0 motion-safe:active:translate-y-0 hover:shadow-none" aria-label={t('serviceDesk.sendReply', 'Send reply')} title={t('serviceDesk.sendReply', 'Send reply')} disabled={saving || !canReply}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3" />{t('serviceDesk.ticketLifecycle', 'This conversation remains one ticket until it is closed.')}</p>
                </form>
              </>}
            </>}
          </div>
        </div>
      </section>
    </PrivacySupportShell>
  );
}
